const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

console.log('🚀 Запуск сервера...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Инициализация таблицы orders
async function initDB() {
  const query = `
    CREATE TABLE IF NOT EXISTS orders (
      id             SERIAL PRIMARY KEY,
      order_number   BIGINT,
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
    console.log('✅ Таблица orders готова');
    
    // Добавляем колонку verification_code если её нет
    try {
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_code TEXT`);
      console.log('✅ Колонка verification_code добавлена');
    } catch(e) { console.log('Колонка уже существует'); }
    
    const result = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`📦 В базе данных ${result.rows[0].count} заказов`);
  } catch (err) {
    console.error('❌ Ошибка при создании таблицы:', err.message);
  }
}

// Уведомление админа
async function notifyAdmin(bot, order) {
  try {
    const items = JSON.parse(order.items || '[]');
    const list = items.map(i => `${i.name} x${i.qty}`).join('\n');
    
    await bot.telegram.sendMessage(
      ADMIN_ID,
      '🆕 НОВЫЙ ЗАКАЗ #' + order.order_number + '\n\n' +
      '👤 Покупатель: ' + (order.sender_name || '-') + '\n' +
      '📧 Email: ' + (order.email || '-') + '\n' +
      '💳 Оплата: ' + (order.payment_method || '-') + '\n\n' +
      '📦 Товары:\n' + list + '\n\n' +
      '💰 Итого: ' + order.total + ' руб\n' +
      '📅 Время: ' + order.date + ' ' + (order.time || '')
    );
    console.log('✅ Уведомление отправлено админу');
  } catch (err) {
    console.error('❌ Ошибка уведомления админа:', err.message);
  }
}

// Уведомление пользователя
async function notifyUser(bot, order) {
  if (!order.user_id) return;
  
  try {
    const items = JSON.parse(order.items || '[]');
    const list = items.map(i => `${i.name} x${i.qty}`).join('\n');
    
    await bot.telegram.sendMessage(
      order.user_id,
      '✅ Заказ #' + order.order_number + ' получен!\n\n' +
      '📦 Состав:\n' + list + '\n\n' +
      '💰 Сумма: ' + order.total + ' руб\n\n' +
      '🔄 Администратор проверит оплату и свяжется с вами.'
    );
    console.log('✅ Уведомление отправлено пользователю');
  } catch (err) {
    console.error('❌ Ошибка уведомления пользователя:', err.message);
  }
}

// ЗАПУСК БОТА
if (BOT_TOKEN) {
  const bot = new Telegraf(BOT_TOKEN);
  
  bot.start((ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || 'Пользователь';
    
    console.log(`📱 Пользователь ${userId} (${firstName}) открыл бота`);
    
    if (userId === ADMIN_ID) {
      ctx.reply(`👑 Здравствуйте, Администратор ${firstName}!`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Управление заказами', web_app: { url: 'https://gemstorm-app-production.up.railway.app/admin-panel.html' } }]
          ]
        }
      });
    } else {
      ctx.reply(`🛍️ Добро пожаловать в магазин, ${firstName}!`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Открыть магазин', web_app: { url: 'https://gemstorm-app-production.up.railway.app/index.html' } }]
          ]
        }
      });
    }
  });
  
  bot.launch();
  console.log('🤖 Бот запущен');
  
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.log('⚠️ BOT_TOKEN не задан, бот не запущен');
}

// ========== API ЭНДПОИНТЫ ==========

// Проверка статуса
app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM orders');
    res.json({ status: 'ok', bot: !!BOT_TOKEN, ordersCount: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Все заказы (для админа)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Заказы пользователя
app.get('/api/user-orders', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.json([]);
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать заказ
app.post('/api/order', async (req, res) => {
  try {
    const o = req.body;
    const result = await pool.query(
      `INSERT INTO orders 
       (order_number, date, time, timestamp, items, total, promo, promo_discount, 
        payment_method, sender_name, email, user_id, user_name, user_username) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [o.orderNumber, o.date, o.time, o.timestamp, JSON.stringify(o.items), o.total, 
       o.promo || null, o.promo_discount || 0, o.payment_method || null, 
       o.sender_name || null, o.email || null, o.user_id || null, o.user_name || null, o.user_username || null]
    );
    const saved = result.rows[0];
    console.log('✅ Заказ #' + saved.order_number + ' сохранён');
    if (BOT_TOKEN) {
      const bot = new Telegraf(BOT_TOKEN);
      await notifyAdmin(bot, saved);
      await notifyUser(bot, saved);
    }
    res.json({ success: true, orderId: saved.id });
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Обновить статус заказа
app.post('/api/update-status', async (req, res) => {
  try {
    const { orderId, status, statusCode } = req.body;
    const result = await pool.query('UPDATE orders SET status=$1, status_code=$2 WHERE id=$3 RETURNING *', [status, statusCode, orderId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
    const order = result.rows[0];
    if (BOT_TOKEN && order.user_id) {
      const bot = new Telegraf(BOT_TOKEN);
      await bot.telegram.sendMessage(order.user_id, '🔄 Статус заказа #' + order.order_number + ' изменён: ' + status);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отправить код подтверждения
app.post('/api/submit-code', async (req, res) => {
  try {
    const { orderId, code } = req.body;
    console.log(`🔐 Получен код от пользователя для заказа #${orderId}: ${code}`);
    const result = await pool.query('UPDATE orders SET verification_code = $1 WHERE id = $2 RETURNING *', [code, orderId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
    if (BOT_TOKEN) {
      const bot = new Telegraf(BOT_TOKEN);
      await bot.telegram.sendMessage(ADMIN_ID, `🔐 НОВЫЙ КОД ДЛЯ ЗАКАЗА #${result.rows[0].order_number}\n\nКод: ${code}\nПользователь: @${result.rows[0].user_username || 'без юзернейма'}\nEmail: ${result.rows[0].email || '—'}`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ЗАПУСК ==========
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`👑 Администратор: ${ADMIN_ID}`);
  });
}).catch((err) => {
  console.error('❌ Ошибка БД:', err.message);
  process.exit(1);
});