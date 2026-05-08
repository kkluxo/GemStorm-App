const express = require(‘express’);
const { Telegraf } = require(‘telegraf’);
const cors = require(‘cors’);
const { Pool } = require(‘pg’);

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

console.log(‘🚀 Запуск сервера…’);
console.log(‘BOT_TOKEN:’, BOT_TOKEN ? ‘✅ Установлен’ : ‘❌ НЕ УСТАНОВЛЕН’);
console.log(‘DATABASE_URL:’, process.env.DATABASE_URL ? ‘✅ Установлен’ : ‘❌ НЕ УСТАНОВЛЕН’);

app.use(cors());
app.use(express.json());
app.use(express.static(’.’));

// ── PostgreSQL ─────────────────────────────────────────────────────────────
const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: process.env.DATABASE_URL?.includes(‘railway’) ? { rejectUnauthorized: false } : false
});

async function initDB() {
await pool.query(`CREATE TABLE IF NOT EXISTS orders ( id              SERIAL PRIMARY KEY, order_number    BIGINT, date            TEXT, time            TEXT, timestamp       TEXT, items           TEXT, total           INTEGER, status          TEXT DEFAULT '🟡 Ожидает проверки', status_code     TEXT DEFAULT 'pending', promo           TEXT, promo_discount  INTEGER DEFAULT 0, payment_method  TEXT, sender_name     TEXT, email           TEXT, user_id         BIGINT, user_name       TEXT, user_username   TEXT, created_at      TIMESTAMPTZ DEFAULT NOW() )`);
console.log(‘✅ Таблица orders готова’);
}

// ── Хелперы ────────────────────────────────────────────────────────────────
function formatPrice(p) {
return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ’ ’) + ‘₽’;
}

async function notifyAdmin(bot, order) {
const items = JSON.parse(order.items || ‘[]’);
const list = items.map(i => `└ ${i.name} ×${i.qty} — ${formatPrice(i.price * i.qty)}`).join(’\n’);
await bot.telegram.sendMessage(ADMIN_ID,
`🛒 *НОВЫЙ ЗАКАЗ #${order.order_number}*\n\n` +
`👤 *Покупатель:* ${order.sender_name || '—'}\n` +
`📧 *Email:* ${order.email || '—'}\n` +
`💳 *Оплата:* ${order.payment_method || '—'}\n\n` +
`📦 *Товары:*\n${list}\n\n` +
`💰 *Итого:* ${formatPrice(order.total)}\n` +
`🕐 *Время:* ${order.date} ${order.time}`,
{ parse_mode: ‘Markdown’ }
);
}

async function notifyUser(bot, order) {
if (!order.user_id) return;
const items = JSON.parse(order.items || ‘[]’);
const list = items.map(i => `└ ${i.name} ×${i.qty} — ${formatPrice(i.price * i.qty)}`).join(’\n’);
await bot.telegram.sendMessage(order.user_id,
`✅ *Заказ #${order.order_number} получен!*\n\n` +
`📦 *Состав:*\n${list}\n\n` +
`💰 *Сумма:* ${formatPrice(order.total)}\n\n` +
`Администратор проверит оплату и свяжется с вами.`,
{ parse_mode: ‘Markdown’ }
);
}

// ── API ────────────────────────────────────────────────────────────────────

app.get(’/api/status’, async (req, res) => {
const { rows } = await pool.query(‘SELECT COUNT(*) as count FROM orders’);
res.json({ status: ‘ok’, bot: !!BOT_TOKEN, ordersCount: parseInt(rows[0].count) });
});

app.get(’/api/orders’, async (req, res) => {
try {
const { rows } = await pool.query(‘SELECT * FROM orders ORDER BY id DESC’);
res.json(rows);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get(’/api/user-orders’, async (req, res) => {
try {
const { userId } = req.query;
if (!userId) return res.json([]);
const { rows } = await pool.query(
‘SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC’, [userId]
);
res.json(rows);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.post(’/api/order’, async (req, res) => {
try {
const o = req.body;
const { rows } = await pool.query(`INSERT INTO orders (order_number, date, time, timestamp, items, total, promo, promo_discount, payment_method, sender_name, email, user_id, user_name, user_username) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [
o.orderNumber, o.date, o.time, o.timestamp,
JSON.stringify(o.items), o.total,
o.promo || null, o.promo_discount || 0,
o.payment_method || null, o.sender_name || null, o.email || null,
o.user_id || null, o.user_name || null, o.user_username || null
]);

```
const saved = rows[0];
console.log(`📦 Новый заказ #${saved.order_number}, ${saved.total}₽`);

if (BOT_TOKEN) {
  const bot = new Telegraf(BOT_TOKEN);
  try { await notifyAdmin(bot, saved); } catch(e) { console.warn('⚠️ Админ:', e.message); }
  try { await notifyUser(bot, saved); }  catch(e) { console.warn('⚠️ Юзер:', e.message); }
}

res.json({ success: true, orderId: saved.id });
```

} catch (err) {
console.error(‘❌’, err.message);
res.status(500).json({ error: err.message });
}
});

app.post(’/api/update-status’, async (req, res) => {
try {
const { orderId, status, statusCode } = req.body;
const { rows } = await pool.query(
‘UPDATE orders SET status=$1, status_code=$2 WHERE id=$3 RETURNING *’,
[status, statusCode, orderId]
);
if (!rows.length) return res.status(404).json({ error: ‘Заказ не найден’ });

```
const order = rows[0];
console.log(`📝 Заказ #${order.order_number} → ${status}`);

if (BOT_TOKEN && order.user_id) {
  const bot = new Telegraf(BOT_TOKEN);
  try {
    await bot.telegram.sendMessage(order.user_id,
      `🔄 Статус заказа #${order.order_number} изменён:\n*${status}*`,
      { parse_mode: 'Markdown' }
    );
  } catch(e) { console.warn('⚠️ Юзер:', e.message); }
}

res.json({ success: true });
```

} catch (err) {
console.error(‘❌’, err.message);
res.status(500).json({ error: err.message });
}
});

// ── Запуск ─────────────────────────────────────────────────────────────────
initDB().then(() => {
app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));
}).catch(err => {
console.error(‘❌ Ошибка БД:’, err.message);
process.exit(1);
});