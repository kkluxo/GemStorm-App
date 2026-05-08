const express = require(‘express’);
const { Telegraf } = require(‘telegraf’);
const cors = require(‘cors’);
const { Pool } = require(‘pg’);

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

console.log(‘Запуск сервера…’);

app.use(cors());
app.use(express.json());
app.use(express.static(’.’));

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false }
});

async function initDB() {
await pool.query(`CREATE TABLE IF NOT EXISTS orders ( id             SERIAL PRIMARY KEY, order_number   BIGINT, date           TEXT, time           TEXT, timestamp      TEXT, items          TEXT, total          INTEGER, status         TEXT DEFAULT '🟡 Ожидает проверки', status_code    TEXT DEFAULT 'pending', promo          TEXT, promo_discount INTEGER DEFAULT 0, payment_method TEXT, sender_name    TEXT, email          TEXT, user_id        BIGINT, user_name      TEXT, user_username  TEXT, created_at     TIMESTAMPTZ DEFAULT NOW() )`);
console.log(‘Таблица orders готова’);
}

function formatPrice(p) {
return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ’ ’) + ‘руб’;
}

async function notifyAdmin(bot, order) {
const items = JSON.parse(order.items || ‘[]’);
const list = items.map(function(i) { return i.name + ’ x’ + i.qty; }).join(’\n’);
await bot.telegram.sendMessage(ADMIN_ID,
‘НОВЫЙ ЗАКАЗ #’ + order.order_number + ‘\n\n’ +
’Покупатель: ’ + (order.sender_name || ‘-’) + ‘\n’ +
’Email: ’ + (order.email || ‘-’) + ‘\n’ +
’Оплата: ’ + (order.payment_method || ‘-’) + ‘\n\n’ +
‘Товары:\n’ + list + ‘\n\n’ +
‘Итого: ’ + order.total + ’ руб\n’ +
’Время: ’ + order.date + ’ ’ + order.time
);
}

async function notifyUser(bot, order) {
if (!order.user_id) return;
const items = JSON.parse(order.items || ‘[]’);
const list = items.map(function(i) { return i.name + ’ x’ + i.qty; }).join(’\n’);
await bot.telegram.sendMessage(order.user_id,
‘Заказ #’ + order.order_number + ’ получен!\n\n’ +
‘Состав:\n’ + list + ‘\n\n’ +
‘Сумма: ’ + order.total + ’ руб\n\n’ +
‘Администратор проверит оплату и свяжется с вами.’
);
}

app.get(’/api/status’, async function(req, res) {
var result = await pool.query(‘SELECT COUNT(*) as count FROM orders’);
res.json({ status: ‘ok’, bot: !!BOT_TOKEN, ordersCount: parseInt(result.rows[0].count) });
});

app.get(’/api/orders’, async function(req, res) {
try {
var result = await pool.query(‘SELECT * FROM orders ORDER BY id DESC’);
res.json(result.rows);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get(’/api/user-orders’, async function(req, res) {
try {
var userId = req.query.userId;
if (!userId) return res.json([]);
var result = await pool.query(‘SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC’, [userId]);
res.json(result.rows);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.post(’/api/order’, async function(req, res) {
try {
var o = req.body;
var result = await pool.query(
‘INSERT INTO orders (order_number, date, time, timestamp, items, total, promo, promo_discount, payment_method, sender_name, email, user_id, user_name, user_username) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *’,
[o.orderNumber, o.date, o.time, o.timestamp, JSON.stringify(o.items), o.total, o.promo || null, o.promo_discount || 0, o.payment_method || null, o.sender_name || null, o.email || null, o.user_id || null, o.user_name || null, o.user_username || null]
);
var saved = result.rows[0];
console.log(‘Новый заказ #’ + saved.order_number);
if (BOT_TOKEN) {
var bot = new Telegraf(BOT_TOKEN);
try { await notifyAdmin(bot, saved); } catch(e) { console.log(’Ошибка уведомления админа: ’ + e.message); }
try { await notifyUser(bot, saved); } catch(e) { console.log(’Ошибка уведомления юзера: ’ + e.message); }
}
res.json({ success: true, orderId: saved.id });
} catch (err) {
console.log(’Ошибка: ’ + err.message);
res.status(500).json({ error: err.message });
}
});

app.post(’/api/update-status’, async function(req, res) {
try {
var orderId = req.body.orderId;
var status = req.body.status;
var statusCode = req.body.statusCode;
var result = await pool.query(‘UPDATE orders SET status=$1, status_code=$2 WHERE id=$3 RETURNING *’, [status, statusCode, orderId]);
if (!result.rows.length) return res.status(404).json({ error: ‘Заказ не найден’ });
var order = result.rows[0];
if (BOT_TOKEN && order.user_id) {
var bot = new Telegraf(BOT_TOKEN);
try {
await bot.telegram.sendMessage(order.user_id, ‘Статус заказа #’ + order.order_number + ’ изменён: ’ + status);
} catch(e) { console.log(’Ошибка уведомления: ’ + e.message); }
}
res.json({ success: true });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

initDB().then(function() {
app.listen(PORT, function() { console.log(’Сервер запущен на порту ’ + PORT); });
}).catch(function(err) {
console.log(’Ошибка БД: ’ + err.message);
process.exit(1);
});