const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

console.log('Запуск сервера...');

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  const query = `
    CREATE TABLE IF NOT EXISTS orders (
      id             SERIAL PRIMARY KEY,
      order_number   INTEGER,
      date           TEXT,
      time           TEXT,
      timestamp      TEXT,
      items          TEXT,
      total          INTEGER,
      status         TEXT DEFAULT 'Ожидание кода',
      status_code    TEXT DEFAULT 'pending',
      promo          TEXT,
      promo_discount INTEGER DEFAULT 0,
      payment_method TEXT,
      sender_name    TEXT,
      email          TEXT,
      user_id        BIGINT,
      user_name      TEXT,
      user_username  TEXT,
      verification_code TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  
  try {
    await pool.query(query);
    console.log('Таблица orders готова');
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_code TEXT`);
    
    const result = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`В базе данных ${result.rows[0].count} заказов`);
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

async function getNextOrderNumber() {
  const result = await pool.query('SELECT COALESCE(MAX(order_number), 0) + 1 as next_num FROM orders');
  return result.rows[0].next_num;
}

async function notifyAdmin(bot, order) {
  try {
    const items = JSON.parse(order.items || '[]');
    const list = items.map(i => `${i.name} x${i.qty}`).join('\n');
    await bot.telegram.sendMessage(ADMIN_ID,
      'НОВЫЙ ЗАКАЗ #' + order.order_number + '\n\n' +
      'Покупатель: ' + (order.sender_name || '-') + '\n' +
      'Email: ' + (order.email || '-') + '\n' +
      'Оплата: ' + (order.payment_method || '-') + '\n\n' +
      'Товары:\n' + list + '\n\n' +
      'Итого: ' + order.total + ' руб\n' +
      'Время: ' + order.date + ' ' + (order.time || '')
    );
  } catch (err) { console.error(err.message); }
}

async function notifyUser(bot, order) {
  if (!order.user_id) return;
  try {
    const items = JSON.parse(order.items || '[]');
    const list = items.map(i => `${i.name} x${i.qty}`).join('\n');
    await bot.telegram.sendMessage(order.user_id,
      'Заказ #' + order.order_number + ' получен!\n\n' +
      'Состав:\n' + list + '\n\n' +
      'Сумма: ' + order.total + ' руб\n\n' +
      'Администратор проверит оплату и свяжется с вами.'
    );
  } catch (err) { console.error(err.message); }
}

if (BOT_TOKEN) {
  const bot = new Telegraf(BOT_TOKEN);
  bot.start((ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || 'Пользователь';
    if (userId === ADMIN_ID) {
      ctx.reply(`Здравствуйте, Администратор ${firstName}!`, {
        reply_markup: { inline_keyboard: [[{ text: 'Управление заказами', web_app: { url: 'https://gemstorm-app-production.up.railway.app/admin-panel.html' } }]] }
      });
    } else {
      ctx.reply(`Добро пожаловать в магазин, ${firstName}!`, {
        reply_markup: { inline_keyboard: [[{ text: 'Открыть магазин', web_app: { url: 'https://gemstorm-app-production.up.railway.app/index.html' } }]] }
      });
    }
  });
  bot.launch();
  console.log('Бот запущен');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM orders');
    res.json({ status: 'ok', bot: !!BOT_TOKEN, ordersCount: parseInt(result.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user-orders', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.json([]);
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC', [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/order', async (req, res) => {
  try {
    const o = req.body;
    const nextNumber = await getNextOrderNumber();
    
    const result = await pool.query(
      `INSERT INTO orders (order_number, date, time, timestamp, items, total, promo, promo_discount, payment_method, sender_name, email, user_id, user_name, user_username) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [nextNumber, o.date, o.time, o.timestamp, JSON.stringify(o.items), o.total, 
       o.promo || null, o.promo_discount || 0, o.payment_method || null, 
       o.sender_name || null, o.email || null, o.user_id || null, o.user_name || null, o.user_username || null]
    );
    const saved = result.rows[0];
    console.log('Заказ #' + saved.order_number + ' сохранён');
    if (BOT_TOKEN) {
      const bot = new Telegraf(BOT_TOKEN);
      await notifyAdmin(bot, saved);
      await notifyUser(bot, saved);
    }
    res.json({ success: true, orderId: saved.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/update-status', async (req, res) => {
  try {
    const { orderId, status, statusCode } = req.body;
    
    // 🔥 АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ status_code ПО ТЕКСТУ СТАТУСА
    let finalStatusCode = statusCode;
    
    // Если statusCode не передан или равен 'pending' - определяем по тексту статуса
    if (!finalStatusCode || finalStatusCode === 'pending') {
      const statusMap = {
        'Ожидание проверки': 'pending',
        'Проверка перевода': 'pending',
        'Ожидание кода': 'awaiting_code',
        'Ожидает выполнения': 'processing',
        'Выполнен': 'completed',
        'Отменён': 'cancelled'
      };
      
      // Ищем соответствие
      for (const [key, value] of Object.entries(statusMap)) {
        if (status === key || status.includes(key)) {
          finalStatusCode = value;
          break;
        }
      }
    }
    
    console.log(`Обновление заказа #${orderId}: статус="${status}" → status_code="${finalStatusCode}"`);
    
    const result = await pool.query(
      'UPDATE orders SET status=$1, status_code=$2 WHERE id=$3 RETURNING *', 
      [status, finalStatusCode, orderId]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
    
    const order = result.rows[0];
    
    if (BOT_TOKEN && order.user_id) {
      const bot = new Telegraf(BOT_TOKEN);
      await bot.telegram.sendMessage(order.user_id, 'Статус заказа #' + order.order_number + ' изменён: ' + status);
    }
    
    res.json({ success: true, order: order });
  } catch (err) { 
    console.error('Ошибка update-status:', err.message);
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/submit-code', async (req, res) => {
  try {
    const { orderId, code } = req.body;
    console.log(`Получен код для заказа #${orderId}: ${code}`);
    const result = await pool.query('UPDATE orders SET verification_code = $1, status = $2, status_code = $3 WHERE id = $4 RETURNING *', 
      [code, 'Ожидает выполнения', 'processing', orderId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
    if (BOT_TOKEN) {
      const bot = new Telegraf(BOT_TOKEN);
      await bot.telegram.sendMessage(ADMIN_ID, `НОВЫЙ КОД ДЛЯ ЗАКАЗА #${result.rows[0].order_number}\n\nКод: ${code}\nПользователь: @${result.rows[0].user_username || 'без юзернейма'}`);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/refresh-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
}).catch((err) => { console.error('Ошибка Базы:', err.message); process.exit(1); });
