const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

const PREVIEW_IMAGE_URL = 'https://storage.botpapa.me/files/13a15050-5364-11f1-bef9-f1ec7a2c6e45.jpeg';
const INVISIBLE_LINK = `<a href="${PREVIEW_IMAGE_URL}">&#8205;</a>`;

const APP_URL = 'https://gemstorm.up.railway.app/';
const ORDERS_PAGE_URL = `${APP_URL}#orders`;
const REVIEWS_PAGE_URL = `${APP_URL}#reviews`;

const NO_FORWARD = { protect_content: true };

console.log('Запуск сервера...');

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function getNextOrderNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let attempts = 0;
    while (attempts < 100) {
        const l1 = letters[Math.floor(Math.random() * 26)];
        const d1 = digits[Math.floor(Math.random() * 10)];
        const l2 = letters[Math.floor(Math.random() * 26)];
        const d2 = digits[Math.floor(Math.random() * 10)];
        const code = `${l1}${d1}${l2}${d2}`;
        const exists = await pool.query('SELECT id FROM orders WHERE order_number = $1', [code]);
        if (!exists.rows.length) return code;
        attempts++;
    }
    throw new Error('Не удалось сгенерировать уникальный номер');
}

async function safeDeleteMessage(bot, chatId, messageId) {
    if (!messageId) return;
    try { await bot.telegram.deleteMessage(chatId, messageId); } catch (e) {}
}

async function notifyAdmin(bot, order) {
    const usernameText = order.user_username ? `@${order.user_username}` : (order.user_name || 'Неизвестен');
    const message = `${INVISIBLE_LINK}<b>Новый заказ от ${usernameText}</b>\n\n<b>Номер заказа:</b> #${order.order_number}\n<b>Сумма заказа:</b> ${order.total}₽\n<b>Способ оплаты:</b> ${order.payment_method || 'Не указан'}`;
    const sent = await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: 'HTML', ...NO_FORWARD, reply_markup: { inline_keyboard: [[{ text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }]] } });
    return sent.message_id;
}

async function notifyAdminCode(bot, order, code, prevAdminMsgId) {
    const usernameText = order.user_username ? `@${order.user_username}` : (order.user_name || 'Неизвестен');
    await safeDeleteMessage(bot, ADMIN_ID, prevAdminMsgId);
    const message = `${INVISIBLE_LINK}<b>Код для заказа от ${usernameText}</b>\n\n<b>Номер заказа:</b> #${order.order_number}\n<b>Код для входа:</b> ${code}`;
    const sent = await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: 'HTML', ...NO_FORWARD, reply_markup: { inline_keyboard: [[{ text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }]] } });
    return sent.message_id;
}

async function notifyAdminReview(bot, userName, userUsername, text) {
    const nick = userUsername ? `@${userUsername}` : (userName || 'Неизвестен');
    const message = `${INVISIBLE_LINK}<b>Новый отзыв от ${nick}</b>\n\n<b>Текст отзыва:</b>\n${text.substring(0, 300)}`;
    await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: 'HTML', ...NO_FORWARD, reply_markup: { inline_keyboard: [[{ text: 'Открыть отзыв в приложении', web_app: { url: REVIEWS_PAGE_URL } }]] } });
}

async function notifyUser(bot, order) {
    try {
        const message = `${INVISIBLE_LINK}<b>Заказ был успешно создан</b>\n\n<b>Номер заказа:</b> #${order.order_number}\n<b>Статус:</b> Ожидает проверки`;
        const sent = await bot.telegram.sendMessage(order.user_id, message, { parse_mode: 'HTML', ...NO_FORWARD, reply_markup: { inline_keyboard: [[{ text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }]] } });
        return sent.message_id;
    } catch (e) { return null; }
}

async function notifyUserStatus(bot, order, status, prevUserMsgId) {
    try {
        await safeDeleteMessage(bot, order.user_id, prevUserMsgId);
        const message = `${INVISIBLE_LINK}<b>Обновление статуса заказа</b>\n\n<b>Номер заказа:</b> #${order.order_number}\n<b>Статус:</b> ${status}`;
        const sent = await bot.telegram.sendMessage(order.user_id, message, { parse_mode: 'HTML', ...NO_FORWARD, reply_markup: { inline_keyboard: [[{ text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }]] } });
        return sent.message_id;
    } catch (e) { return null; }
}

async function initDB() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            order_number TEXT UNIQUE,
            date TEXT,
            time TEXT,
            timestamp BIGINT,
            items TEXT,
            total INTEGER,
            promo TEXT,
            promo_discount INTEGER,
            payment_method TEXT,
            sender_name TEXT,
            email TEXT,
            user_id TEXT,
            user_name TEXT,
            status TEXT DEFAULT 'Ожидает проверки',
            status_code TEXT DEFAULT 'pending',
            verification_code TEXT,
            user_username TEXT,
            promo_item_name TEXT,
            promo_item_category TEXT,
            user_msg_id BIGINT,
            admin_msg_id BIGINT
        )`);
        console.log('Таблица orders готова');

        await pool.query(`CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            user_name TEXT,
            user_username TEXT,
            photo_url TEXT,
            text TEXT,
            stars INTEGER,
            order_id INTEGER,
            order_number TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )`);
        console.log('Таблица reviews готова');

        await pool.query(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            bot_status TEXT DEFAULT 'open',
            work_start TEXT DEFAULT '10:00',
            work_end TEXT DEFAULT '23:59'
        )`);
        console.log('Таблица settings готова');

        await pool.query(`CREATE TABLE IF NOT EXISTS app_users (
            id SERIAL PRIMARY KEY,
            user_id TEXT UNIQUE,
            user_name TEXT,
            user_username TEXT,
            photo_url TEXT,
            first_seen TIMESTAMP DEFAULT NOW(),
            last_seen TIMESTAMP DEFAULT NOW()
        )`);
        console.log('Таблица app_users готова');

        await pool.query(`CREATE TABLE IF NOT EXISTS promo_usage (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            promo_code TEXT,
            order_id INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        )`);
        console.log('Таблица promo_usage готова');

        await pool.query(`CREATE TABLE IF NOT EXISTS roulette_promos (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            order_id INTEGER,
            promo_code TEXT UNIQUE,
            discount_percent INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            used BOOLEAN DEFAULT false,
            used_at TIMESTAMP,
            used_in_order INTEGER
        )`);
        console.log('Таблица roulette_promos готова');

        await pool.query(`CREATE TABLE IF NOT EXISTS roulette_spins (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            order_id INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        )`);
        console.log('Таблица roulette_spins готова');

        console.log('Все таблицы готовы');
    } catch (err) {
        console.error('Ошибка инициализации БД:', err.message);
        throw err;
    }
}

let botInstance = null;

function getBot() {
    if (!BOT_TOKEN) return null;
    if (!botInstance) {
        botInstance = new Telegraf(BOT_TOKEN);
        botInstance.start(async (ctx) => {
            try {
                const message = `${INVISIBLE_LINK}<b>Добро пожаловать в</b> <b><a href="https://t.me/GemStormBot">GemStorm</a></b>\n\n<b><a href="https://t.me/GemStormBot">GemStorm Store</a> - это бот для покупки</b> доната в игры <b>Supercell</b>`;
                await ctx.reply(message, { parse_mode: 'HTML', ...NO_FORWARD, reply_markup: { inline_keyboard: [[{ text: 'Поддержка', url: 'https://t.me/GemStormHelp' }, { text: 'Наш канал', url: 'https://t.me/GemStormStore' }], [{ text: 'Открыть приложение GemStorm', web_app: { url: APP_URL } }]] } });
            } catch (e) { console.error('Ошибка /start:', e.message); }
        });
        botInstance.launch().catch(err => console.error('Ошибка запуска бота:', err.message));
        process.once('SIGINT', () => botInstance.stop('SIGINT'));
        process.once('SIGTERM', () => botInstance.stop('SIGTERM'));
    }
    return botInstance;
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
            `INSERT INTO orders (order_number, date, time, timestamp, items, total, promo, promo_discount, payment_method, sender_name, email, user_id, user_name, user_username, promo_item_name, promo_item_category)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
            [nextNumber, o.date, o.time, o.timestamp, JSON.stringify(o.items), o.total, o.promo || null, o.promo_discount || 0, o.payment_method || null, o.sender_name || null, o.email || null, o.user_id || null, o.user_name || null, o.user_username || null, o.promo_item_name || null, o.promo_item_category || null]
        );

        const saved = result.rows[0];
        console.log(`Заказ #${saved.order_number} сохранён`);

        let userMsgId = null, adminMsgId = null;
        const bot = getBot();
        if (bot) {
            if (saved.user_id) userMsgId = await notifyUser(bot, saved);
            adminMsgId = await notifyAdmin(bot, saved);
        }
        if (userMsgId !== null || adminMsgId !== null) {
            await pool.query('UPDATE orders SET user_msg_id = $1, admin_msg_id = $2 WHERE id = $3', [userMsgId, adminMsgId, saved.id]);
        }
        if (o.promo && o.user_id) {
            try { await pool.query(`INSERT INTO promo_usage (user_id, promo_code, order_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [o.user_id, o.promo.toUpperCase(), saved.id]); } catch (e) {}
        }

        res.json({ success: true, orderId: saved.id });
    } catch (err) {
        console.error('Ошибка создания заказа:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/update-status', async (req, res) => {
    try {
        const { orderId, status, statusCode } = req.body;
        const orderBefore = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (!orderBefore.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
        const prev = orderBefore.rows[0];

        let finalStatusCode = statusCode;
        if (!finalStatusCode) {
            const statusMap = { 'Ожидает проверки': 'pending', 'Ожидание кода': 'awaiting_code', 'Ожидает выполнения': 'processing', 'Выполнен': 'completed', 'Заказ выполнен': 'completed', 'Отменён': 'cancelled' };
            for (const [key, value] of Object.entries(statusMap)) { if (status === key || status.includes(key)) { finalStatusCode = value; break; } }
        }

        const result = await pool.query('UPDATE orders SET status=$1, status_code=$2 WHERE id=$3 RETURNING *', [status, finalStatusCode, orderId]);
        const order = result.rows[0];
        const isCompleted = finalStatusCode === 'completed';

        if (order.user_id && finalStatusCode !== 'pending') {
            const bot = getBot();
            if (bot) {
                const newUserMsgId = await notifyUserStatus(bot, order, status, prev.user_msg_id);
                await pool.query('UPDATE orders SET user_msg_id = $1 WHERE id = $2', [isCompleted ? null : newUserMsgId, orderId]);
            }
        }
        res.json({ success: true, order: order });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/submit-code', async (req, res) => {
    try {
        const { orderId, code } = req.body;
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (!orderResult.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
        const prev = orderResult.rows[0];

        const result = await pool.query('UPDATE orders SET verification_code = $1, status = $2, status_code = $3 WHERE id = $4 RETURNING *', [code, 'Ожидает выполнения', 'processing', orderId]);
        const order = result.rows[0];

        const bot = getBot();
        if (bot) {
            const newUserMsgId = await notifyUserStatus(bot, order, 'Ожидает выполнения', prev.user_msg_id);
            const newAdminMsgId = await notifyAdminCode(bot, order, code, prev.admin_msg_id);
            await pool.query('UPDATE orders SET user_msg_id = $1, admin_msg_id = $2 WHERE id = $3', [newUserMsgId, newAdminMsgId, orderId]);
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

app.post('/api/track-user', async (req, res) => {
    try {
        const { userId, userName, userUsername, photoUrl } = req.body;
        if (!userId) return res.json({ success: false });
        await pool.query(`INSERT INTO app_users (user_id, user_name, user_username, photo_url, last_seen) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (user_id) DO UPDATE SET user_name = EXCLUDED.user_name, user_username = EXCLUDED.user_username, photo_url = EXCLUDED.photo_url, last_seen = NOW()`, [userId, userName || null, userUsername || null, photoUrl || null]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user-spins', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.json({ spins: [] });
        const result = await pool.query('SELECT order_id FROM roulette_spins WHERE user_id = $1 ORDER BY id DESC', [userId]);
        res.json({ spins: result.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/spin-roulette', async (req, res) => {
    try {
        const { userId, orderId, discount } = req.body;
        if (!userId || !orderId || !discount) return res.status(400).json({ error: 'Недостаточно данных' });

        const existing = await pool.query('SELECT id FROM roulette_spins WHERE user_id = $1 AND order_id = $2', [userId, orderId]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Для этого заказа уже использована прокрутка' });

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        let promoCode = '';
        let attempts = 0;
        let isUnique = false;
        while (!isUnique && attempts < 50) {
            promoCode = `ROULETTE${letters[Math.floor(Math.random() * 26)]}${digits[Math.floor(Math.random() * 10)]}${digits[Math.floor(Math.random() * 10)]}`;
            const existingCode = await pool.query('SELECT id FROM roulette_promos WHERE promo_code = $1', [promoCode]);
            if (existingCode.rows.length === 0) isUnique = true;
            attempts++;
        }

        await pool.query(`INSERT INTO roulette_promos (user_id, order_id, promo_code, discount_percent, created_at, used) VALUES ($1, $2, $3, $4, NOW(), false)`, [userId, orderId, promoCode, parseInt(discount)]);
        await pool.query(`INSERT INTO roulette_spins (user_id, order_id, created_at) VALUES ($1, $2, NOW())`, [userId, orderId]);

        res.json({ success: true, promoCode });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/check-promo', async (req, res) => {
    try {
        const { code, userId } = req.body;
        if (!code || !userId) return res.status(400).json({ error: 'Нет данных' });

        const upperCode = code.toUpperCase();
        const rouletteResult = await pool.query(`SELECT * FROM roulette_promos WHERE promo_code = $1 AND used = false`, [upperCode]);
        if (rouletteResult.rows.length > 0) {
            const promo = rouletteResult.rows[0];
            const createdAt = new Date(promo.created_at);
            const now = new Date();
            const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) return res.json({ valid: false, reason: 'expired' });
            return res.json({ valid: true, discount: promo.discount_percent, type: 'roulette', promoId: promo.id });
        }

        const validCodes = { 'GEMSTORMP3': 3, 'CL3PER0': 5, 'WEL9825H0': 1 };
        if (!validCodes[upperCode]) return res.json({ valid: false, reason: 'not_found' });

        if (upperCode === 'GEMSTORMP3') {
            const ordersResult = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE user_id = $1`, [userId]);
            if (parseInt(ordersResult.rows[0].count) > 0) return res.json({ valid: false, reason: 'first_order_only' });
        }

        const usageResult = await pool.query(`SELECT pu.id, o.status_code FROM promo_usage pu LEFT JOIN orders o ON o.id = pu.order_id WHERE pu.user_id = $1 AND pu.promo_code = $2`, [userId, upperCode]);
        if (usageResult.rows.length > 0) {
            const allNotFound = usageResult.rows.every(r => r.status_code === 'notfound');
            if (!allNotFound) return res.json({ valid: false, reason: 'already_used' });
        }

        res.json({ valid: true, discount: validCodes[upperCode] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/use-promo', async (req, res) => {
    try {
        const { userId, code, orderId } = req.body;
        if (!userId || !code || !orderId) return res.status(400).json({ error: 'Нет данных' });
        await pool.query(`INSERT INTO promo_usage (user_id, promo_code, order_id) VALUES ($1, $2, $3)`, [userId, code.toUpperCase(), orderId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings WHERE id = 1');
        if (!result.rows.length) res.json({ bot_status: 'open', work_start: '10:00', work_end: '23:59' });
        else res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query(`SELECT r.*, o.items as order_items FROM reviews r LEFT JOIN orders o ON o.order_number = r.order_number ORDER BY r.created_at DESC LIMIT 50`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { userId, userName, userUsername, photoUrl, text, stars, orderId, orderNumber } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Текст обязателен' });
        await pool.query(`INSERT INTO reviews (user_id, user_name, user_username, photo_url, text, stars, order_id, order_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [userId || null, userName || 'Пользователь', userUsername || null, photoUrl || null, text.trim(), stars || 5, orderId || null, orderNumber || null]);
        const bot = getBot();
        if (bot) { try { await notifyAdminReview(bot, userName, userUsername, text.trim()); } catch (e) {} }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

initDB().then(async () => {
    if (BOT_TOKEN) { getBot(); console.log('Telegram бот запущен'); }
    else { console.warn('BOT_TOKEN не установлен, бот не запущен'); }
    app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
}).catch((err) => { console.error('Ошибка Базы:', err.message); process.exit(1); });