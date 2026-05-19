const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

// Предпросмотр изображения через невидимый символ
const PREVIEW_IMAGE_URL = 'https://storage.botpapa.me/files/0a2344e0-5362-11f1-bef9-f1ec7a2c6e45.jpeg';
const INVISIBLE_LINK = `<a href="${PREVIEW_IMAGE_URL}">&#8205;</a>`;

// Ссылки на приложение
const APP_URL = 'https://gemstorm.up.railway.app/';
const ORDERS_PAGE_URL = `${APP_URL}#orders`;
const REVIEWS_PAGE_URL = `${APP_URL}#reviews`;

// Запрет пересылки сообщений
const NO_FORWARD = { protect_content: true };

console.log('Запуск сервера...');

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// =============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================

async function getNextOrderNumber() {
    const result = await pool.query('SELECT COALESCE(MAX(order_number), 0) + 1 as next FROM orders');
    return result.rows[0].next;
}

// Безопасное удаление сообщения (игнорирует ошибки если уже удалено)
async function safeDeleteMessage(bot, chatId, messageId) {
    if (!messageId) return;
    try {
        await bot.telegram.deleteMessage(chatId, messageId);
    } catch (e) {
        console.log(`Не удалось удалить сообщение ${messageId}: ${e.message}`);
    }
}

// =============================================
// УВЕДОМЛЕНИЯ АДМИНИСТРАТОРУ
// =============================================

// Отправить новый заказ админу, вернуть message_id
async function notifyAdmin(bot, order) {
    const usernameText = order.user_username ? `@${order.user_username}` : (order.user_name || 'Неизвестен');

    const message =
        `${INVISIBLE_LINK}<b>Новый заказ от ${usernameText}</b>\n\n` +
        `<b>Заказ:</b> #${order.order_number}\n` +
        `<b>Сумма заказа:</b> ${order.total} руб.\n` +
        `<b>Способ оплаты:</b> ${order.payment_method || 'Не указан'}`;

    const sent = await bot.telegram.sendMessage(ADMIN_ID, message, {
        parse_mode: 'HTML',
        ...NO_FORWARD,
        reply_markup: {
            inline_keyboard: [[
                { text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }
            ]]
        }
    });

    return sent.message_id;
}

// Отправить код от пользователя админу (удаляет предыдущее сообщение о заказе)
async function notifyAdminCode(bot, order, code, prevAdminMsgId) {
    const usernameText = order.user_username ? `@${order.user_username}` : (order.user_name || 'Неизвестен');

    await safeDeleteMessage(bot, ADMIN_ID, prevAdminMsgId);

    const message =
        `${INVISIBLE_LINK}<b>Код для заказа от ${usernameText}</b>\n\n` +
        `<b>Заказ:</b> #${order.order_number}\n` +
        `<b>Код для входа:</b> ${code}`;

    const sent = await bot.telegram.sendMessage(ADMIN_ID, message, {
        parse_mode: 'HTML',
        ...NO_FORWARD,
        reply_markup: {
            inline_keyboard: [[
                { text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }
            ]]
        }
    });

    return sent.message_id;
}

// Уведомить админа об отзыве
async function notifyAdminReview(bot, userName, userUsername, text) {
    const nick = userUsername ? `@${userUsername}` : (userName || 'Неизвестен');

    const message =
        `${INVISIBLE_LINK}<b>Новый отзыв от ${nick}</b>\n\n` +
        `<b>Текст отзыва:</b>\n${text.substring(0, 300)}`;

    await bot.telegram.sendMessage(ADMIN_ID, message, {
        parse_mode: 'HTML',
        ...NO_FORWARD,
        reply_markup: {
            inline_keyboard: [[
                { text: 'Открыть отзыв в приложении', web_app: { url: REVIEWS_PAGE_URL } }
            ]]
        }
    });
}

// =============================================
// УВЕДОМЛЕНИЯ ПОЛЬЗОВАТЕЛЮ
// =============================================

// Отправить сообщение о создании заказа, вернуть message_id
async function notifyUser(bot, order) {
    try {
        const message =
            `${INVISIBLE_LINK}<b>Заказ был успешно создан</b>\n\n` +
            `<b>Номер заказа:</b> #${order.order_number}\n` +
            `<b>Статус:</b> Ожидает проверки`;

        const sent = await bot.telegram.sendMessage(order.user_id, message, {
            parse_mode: 'HTML',
            ...NO_FORWARD,
            reply_markup: {
                inline_keyboard: [[
                    { text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }
                ]]
            }
        });

        return sent.message_id;
    } catch (e) {
        console.error('Не удалось уведомить пользователя:', e.message);
        return null;
    }
}

// Отправить обновление статуса пользователю (удаляет предыдущее сообщение бота)
async function notifyUserStatus(bot, order, status, prevUserMsgId) {
    try {
        await safeDeleteMessage(bot, order.user_id, prevUserMsgId);

        const message =
            `${INVISIBLE_LINK}<b>Обновление статуса заказа</b>\n\n` +
            `<b>Номер заказа:</b> #${order.order_number}\n` +
            `<b>Статус:</b> ${status}`;

        const sent = await bot.telegram.sendMessage(order.user_id, message, {
            parse_mode: 'HTML',
            ...NO_FORWARD,
            reply_markup: {
                inline_keyboard: [[
                    { text: 'Открыть заказ в приложении', web_app: { url: ORDERS_PAGE_URL } }
                ]]
            }
        });

        return sent.message_id;
    } catch (e) {
        console.error('Не удалось отправить статус пользователю:', e.message);
        return null;
    }
}

// =============================================
// ИНИЦИАЛИЗАЦИЯ БД
// =============================================

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number INTEGER UNIQUE,
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
            )
        `);
        console.log('Таблица orders готова');

        // Миграция колонок
        const colDefs = [
            'user_username TEXT',
            'verification_code TEXT',
            'promo_item_name TEXT',
            'promo_item_category TEXT',
            'user_msg_id BIGINT',
            'admin_msg_id BIGINT'
        ];
        for (const col of colDefs) {
            await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col}`);
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                user_name TEXT,
                user_username TEXT,
                photo_url TEXT,
                text TEXT,
                stars INTEGER,
                order_id INTEGER,
                order_number INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id INTEGER`);
        await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_number INTEGER`);
        await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_username TEXT`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                bot_status TEXT DEFAULT 'open',
                work_start TEXT DEFAULT '10:00',
                work_end TEXT DEFAULT '23:59'
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_users (
                id SERIAL PRIMARY KEY,
                user_id TEXT UNIQUE,
                user_name TEXT,
                user_username TEXT,
                photo_url TEXT,
                first_seen TIMESTAMP DEFAULT NOW(),
                last_seen TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS promo_usage (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                promo_code TEXT,
                order_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_rate_limit (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('Все таблицы готовы');

        const result = await pool.query('SELECT COUNT(*) as count FROM orders');
        console.log(`В базе данных ${result.rows[0].count} заказов`);
    } catch (err) {
        console.error('Ошибка инициализации БД:', err.message);
        throw err;
    }
}

// =============================================
// TELEGRAM BOT
// =============================================

let botInstance = null;

function getBot() {
    if (!BOT_TOKEN) return null;
    if (!botInstance) {
        botInstance = new Telegraf(BOT_TOKEN);

        // /start — сообщение НЕ удаляется, защита от пересылки
        botInstance.start(async (ctx) => {
            try {
                const message =
                    `${INVISIBLE_LINK}<b>Добро пожаловать</b> в\n` +
                    `<b><a href="https://t.me/GemStormBot">GemStorm</a></b>\n\n` +
                    `<b><a href="https://t.me/GemStormBot">GemStorm Store</a> - это бот для покупки</b> доната в игры <b>Supercell</b>`;

                await ctx.reply(message, {
                    parse_mode: 'HTML',
                    ...NO_FORWARD,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Поддержка', url: 'https://t.me/GemStormHelp' },
                                { text: 'Наш канал', url: 'https://t.me/GemStormStore' }
                            ],
                            [
                                { text: 'Открыть приложение GemStorm', web_app: { url: APP_URL } }
                            ]
                        ]
                    }
                });
            } catch (e) {
                console.error('Ошибка /start:', e.message);
            }
        });

        botInstance.launch().catch(err => {
            console.error('Ошибка запуска бота:', err.message);
        });

        process.once('SIGINT', () => botInstance.stop('SIGINT'));
        process.once('SIGTERM', () => botInstance.stop('SIGTERM'));
    }
    return botInstance;
}

// =============================================
// API ЭНДПОИНТЫ
// =============================================

app.get('/api/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM orders');
        res.json({ status: 'ok', bot: !!BOT_TOKEN, ordersCount: parseInt(result.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        const nextNumber = await getNextOrderNumber();

        const result = await pool.query(
            `INSERT INTO orders (
                order_number, date, time, timestamp, items, total, promo,
                promo_discount, payment_method, sender_name, email, user_id, user_name, user_username,
                promo_item_name, promo_item_category
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
            [
                nextNumber, o.date, o.time, o.timestamp, JSON.stringify(o.items), o.total,
                o.promo || null, o.promo_discount || 0, o.payment_method || null,
                o.sender_name || null, o.email || null, o.user_id || null, o.user_name || null,
                o.user_username || null, o.promo_item_name || null, o.promo_item_category || null
            ]
        );

        const saved = result.rows[0];
        console.log(`Заказ #${saved.order_number} сохранён`);

        let userMsgId = null;
        let adminMsgId = null;

        const bot = getBot();
        if (bot) {
            if (saved.user_id) {
                userMsgId = await notifyUser(bot, saved);
            }
            adminMsgId = await notifyAdmin(bot, saved);
        }

        // Сохраняем message_id сразу после отправки
        if (userMsgId !== null || adminMsgId !== null) {
            await pool.query(
                'UPDATE orders SET user_msg_id = $1, admin_msg_id = $2 WHERE id = $3',
                [userMsgId, adminMsgId, saved.id]
            );
        }

        // Записать использование промокода
        if (o.promo && o.user_id) {
            try {
                await pool.query(`
                    INSERT INTO promo_usage (user_id, promo_code, order_id)
                    VALUES ($1, $2, $3)
                    ON CONFLICT DO NOTHING
                `, [o.user_id, o.promo.toUpperCase(), saved.id]);
            } catch (e) {
                console.error('Ошибка записи промокода:', e.message);
            }
        }

        res.json({ success: true, orderId: saved.id });
    } catch (err) {
        console.error('Ошибка создания заказа:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Обновить статус заказа
app.post('/api/update-status', async (req, res) => {
    try {
        const { orderId, status, statusCode } = req.body;

        // Читаем текущий заказ (нужны message_id)
        const orderBefore = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (!orderBefore.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
        const prev = orderBefore.rows[0];

        let finalStatusCode = statusCode;
        if (!finalStatusCode) {
            const statusMap = {
                'Ожидание проверки': 'pending',
                'Ожидает проверки': 'pending',
                'Проверка перевода': 'pending',
                'Ожидание кода': 'awaiting_code',
                'Ожидает выполнения': 'processing',
                'Выполнен': 'completed',
                'Заказ выполнен': 'completed',
                'Отменён': 'cancelled'
            };
            for (const [key, value] of Object.entries(statusMap)) {
                if (status === key || status.includes(key)) {
                    finalStatusCode = value;
                    break;
                }
            }
        }

        console.log(`Обновление заказа #${prev.order_number}: статус="${status}" → status_code="${finalStatusCode}"`);

        const result = await pool.query(
            'UPDATE orders SET status=$1, status_code=$2 WHERE id=$3 RETURNING *',
            [status, finalStatusCode, orderId]
        );

        const order = result.rows[0];
        const isCompleted = finalStatusCode === 'completed';

        // Уведомляем пользователя только если не "Ожидает проверки"
        if (order.user_id && finalStatusCode !== 'pending') {
            const bot = getBot();
            if (bot) {
                // Отправляем новое сообщение (удаляя предыдущее)
                const newUserMsgId = await notifyUserStatus(bot, order, status, prev.user_msg_id);

                // Если заказ выполнен — не сохраняем msg_id (финальное сообщение не удаляем)
                await pool.query(
                    'UPDATE orders SET user_msg_id = $1 WHERE id = $2',
                    [isCompleted ? null : newUserMsgId, orderId]
                );
            }
        }

        res.json({ success: true, order: order });
    } catch (err) {
        console.error('Ошибка update-status:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Пользователь отправил код верификации
app.post('/api/submit-code', async (req, res) => {
    try {
        const { orderId, code } = req.body;
        console.log(`Получен код для заказа #${orderId}: ${code}`);

        // Читаем заказ до обновления
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (!orderResult.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
        const prev = orderResult.rows[0];

        const result = await pool.query(
            'UPDATE orders SET verification_code = $1, status = $2, status_code = $3 WHERE id = $4 RETURNING *',
            [code, 'Ожидает выполнения', 'processing', orderId]
        );

        if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
        const order = result.rows[0];

        const bot = getBot();
        if (bot) {
            // Пользователю — обновление статуса (удаляет предыдущее)
            const newUserMsgId = await notifyUserStatus(bot, order, 'Ожидает выполнения', prev.user_msg_id);

            // Админу — сообщение с кодом (удаляет предыдущее "Новый заказ")
            const newAdminMsgId = await notifyAdminCode(bot, order, code, prev.admin_msg_id);

            // Сохраняем новые message_id
            await pool.query(
                'UPDATE orders SET user_msg_id = $1, admin_msg_id = $2 WHERE id = $3',
                [newUserMsgId, newAdminMsgId, orderId]
            );
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/refresh-order', async (req, res) => {
    try {
        const { orderId } = req.body;
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/track-user', async (req, res) => {
    try {
        const { userId, userName, userUsername, photoUrl } = req.body;
        if (!userId) return res.json({ success: false });
        await pool.query(`
            INSERT INTO app_users (user_id, user_name, user_username, photo_url, last_seen)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                user_name = EXCLUDED.user_name,
                user_username = EXCLUDED.user_username,
                photo_url = EXCLUDED.photo_url,
                last_seen = NOW()
        `, [userId, userName || null, userUsername || null, photoUrl || null]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/migrate-users', async (req, res) => {
    try {
        await pool.query(`
            INSERT INTO app_users (user_id, user_name, user_username)
            SELECT DISTINCT ON (user_id) user_id, user_name, user_username
            FROM orders WHERE user_id IS NOT NULL
            ON CONFLICT (user_id) DO UPDATE SET
                user_name = EXCLUDED.user_name,
                user_username = EXCLUDED.user_username
        `);
        const count = await pool.query('SELECT COUNT(*) as count FROM app_users');
        res.json({ success: true, users: parseInt(count.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/debug-users', async (req, res) => {
    try {
        const appUsers = await pool.query('SELECT COUNT(*) as count FROM app_users');
        const orders = await pool.query('SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE user_id IS NOT NULL');
        const sample = await pool.query('SELECT user_id, user_name FROM orders WHERE user_id IS NOT NULL LIMIT 3');
        res.json({
            app_users_count: parseInt(appUsers.rows[0].count),
            orders_unique_users: parseInt(orders.rows[0].count),
            sample_order_users: sample.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const checkEmpty = await pool.query('SELECT COUNT(*) as count FROM app_users');
        if (parseInt(checkEmpty.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO app_users (user_id, user_name, user_username)
                SELECT user_id, MAX(user_name), MAX(user_username)
                FROM orders WHERE user_id IS NOT NULL
                GROUP BY user_id
                ON CONFLICT (user_id) DO UPDATE SET
                    user_name = EXCLUDED.user_name,
                    user_username = EXCLUDED.user_username
            `);
        }

        const result = await pool.query(`
            SELECT
                au.user_id, au.user_name, au.user_username, au.photo_url,
                au.first_seen, au.last_seen,
                COALESCE(o.orders_count, 0) as orders_count,
                COALESCE(o.total_spent, 0) as total_spent
            FROM app_users au
            LEFT JOIN (
                SELECT user_id::TEXT, COUNT(*) as orders_count, SUM(total) as total_spent
                FROM orders WHERE user_id IS NOT NULL
                GROUP BY user_id::TEXT
            ) o ON au.user_id::TEXT = o.user_id
            ORDER BY COALESCE(o.total_spent, 0) DESC, au.first_seen DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка /api/users:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/total-revenue', async (req, res) => {
    try {
        const result = await pool.query(`SELECT COALESCE(SUM(total), 0) as revenue FROM orders`);
        res.json({ revenue: parseInt(result.rows[0].revenue) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/check-queue', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(*) as count FROM orders
            WHERE status_code IN ('pending', 'awaiting_code', 'processing')
        `);
        const count = parseInt(result.rows[0].count);
        res.json({ busy: count >= 2, count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/check-rate-limit', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.json({ limited: false });

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const recentResult = await pool.query(`
            SELECT COUNT(*) as count FROM orders
            WHERE user_id = $1 AND timestamp >= $2
        `, [userId, tenMinutesAgo]);

        const recentCount = parseInt(recentResult.rows[0].count);
        if (recentCount >= 3) {
            const firstResult = await pool.query(`
                SELECT timestamp FROM orders WHERE user_id = $1
                ORDER BY id DESC LIMIT 3
            `, [userId]);
            const oldest = firstResult.rows[firstResult.rows.length - 1];
            if (oldest) {
                const limitUntil = new Date(oldest.timestamp).getTime() + 30 * 60 * 1000;
                if (Date.now() < limitUntil) return res.json({ limited: true });
            }
        }

        res.json({ limited: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/check-promo', async (req, res) => {
    try {
        const { code, userId } = req.body;
        if (!code || !userId) return res.status(400).json({ error: 'Нет данных' });

        const upperCode = code.toUpperCase();
        const validCodes = { 'GEMSTORM3': 3, 'CL3PER': 5, 'WEL9825H0': 1 };

        if (!validCodes[upperCode]) return res.json({ valid: false, reason: 'not_found' });

        if (upperCode === 'GEMSTORM3') {
            const ordersResult = await pool.query(
                `SELECT COUNT(*) as count FROM orders WHERE user_id = $1`, [userId]
            );
            if (parseInt(ordersResult.rows[0].count) > 0) {
                return res.json({ valid: false, reason: 'first_order_only' });
            }
        }

        const usageResult = await pool.query(`
            SELECT pu.id, o.status_code FROM promo_usage pu
            LEFT JOIN orders o ON o.id = pu.order_id
            WHERE pu.user_id = $1 AND pu.promo_code = $2
        `, [userId, upperCode]);

        if (usageResult.rows.length > 0) {
            const allNotFound = usageResult.rows.every(r => r.status_code === 'notfound');
            if (!allNotFound) return res.json({ valid: false, reason: 'already_used' });
        }

        res.json({ valid: true, discount: validCodes[upperCode] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/use-promo', async (req, res) => {
    try {
        const { userId, code, orderId } = req.body;
        if (!userId || !code || !orderId) return res.status(400).json({ error: 'Нет данных' });
        await pool.query(
            `INSERT INTO promo_usage (user_id, promo_code, order_id) VALUES ($1, $2, $3)`,
            [userId, code.toUpperCase(), orderId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings WHERE id = 1');
        if (!result.rows.length) {
            res.json({ bot_status: 'open', work_start: '10:00', work_end: '23:59' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { bot_status } = req.body;
        await pool.query(`
            INSERT INTO settings (id, bot_status) VALUES (1, $1)
            ON CONFLICT (id) DO UPDATE SET bot_status = $1
        `, [bot_status]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/rating', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, user_name, COALESCE(SUM(total), 0) as total_spent
             FROM orders WHERE status_code = 'completed'
             GROUP BY user_id, user_name
             ORDER BY total_spent DESC LIMIT 100`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const week = new Date(today);
        week.setDate(week.getDate() - 7);

        const todayStr = today.toLocaleDateString('ru-RU');
        const weekAgo = week.toISOString();

        const dayOrders = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE date = $1`, [todayStr]);
        const dayUsers = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE date = $1`, [todayStr]);
        const weekOrders = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE timestamp >= $1`, [weekAgo]);
        const weekUsers = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE timestamp >= $1`, [weekAgo]);
        const allOrders = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders`);
        const allUsers = await pool.query(`SELECT COUNT(*) as count FROM app_users`);
        const activeUsers = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE user_id IS NOT NULL`);
        const avgOrder = await pool.query(`SELECT COALESCE(AVG(total),0) as avg FROM orders`);
        const topProduct = await pool.query(`
            SELECT name, SUM(qty) as total_qty FROM (
                SELECT jsonb_array_elements(items::jsonb)->>'name' as name,
                       (jsonb_array_elements(items::jsonb)->>'qty')::int as qty
                FROM orders
            ) t GROUP BY name ORDER BY total_qty DESC LIMIT 1
        `);

        res.json({
            day: {
                orders: parseInt(dayOrders.rows[0].count),
                revenue: parseInt(dayOrders.rows[0].revenue),
                users: parseInt(dayUsers.rows[0].count)
            },
            week: {
                orders: parseInt(weekOrders.rows[0].count),
                revenue: parseInt(weekOrders.rows[0].revenue),
                users: parseInt(weekUsers.rows[0].count)
            },
            all: {
                orders: parseInt(allOrders.rows[0].count),
                revenue: parseInt(allOrders.rows[0].revenue),
                total_users: parseInt(allUsers.rows[0].count),
                active_users: parseInt(activeUsers.rows[0].count),
                avg_order: Math.round(parseFloat(avgOrder.rows[0].avg)),
                top_product: topProduct.rows[0]?.name || '—'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, o.items as order_items
            FROM reviews r
            LEFT JOIN orders o ON o.order_number = r.order_number
            ORDER BY r.created_at DESC LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { userId, userName, userUsername, photoUrl, text, stars, orderId, orderNumber } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Текст обязателен' });
        }

        const starsVal = stars || 5;

        await pool.query(
            'INSERT INTO reviews (user_id, user_name, user_username, photo_url, text, stars, order_id, order_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
            [userId || null, userName || 'Пользователь', userUsername || null, photoUrl || null, text.trim(), starsVal, orderId || null, orderNumber || null]
        );

        const bot = getBot();
        if (bot) {
            try {
                await notifyAdminReview(bot, userName, userUsername, text.trim());
            } catch (e) {
                console.error('Ошибка уведомления об отзыве:', e.message);
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// ЗАПУСК
// =============================================

initDB().then(async () => {
    try {
        await pool.query(`
            INSERT INTO app_users (user_id, user_name, user_username)
            SELECT user_id::TEXT, MAX(user_name), MAX(user_username)
            FROM orders WHERE user_id IS NOT NULL
            GROUP BY user_id::TEXT
            ON CONFLICT (user_id) DO UPDATE SET
                user_name = EXCLUDED.user_name,
                user_username = EXCLUDED.user_username
        `);
        const count = await pool.query('SELECT COUNT(*) as count FROM app_users');
        console.log(`app_users после миграции: ${count.rows[0].count} пользователей`);
    } catch (e) {
        console.error('Ошибка автомиграции:', e.message);
    }

    if (BOT_TOKEN) {
        getBot();
        console.log('Telegram бот запущен');
    } else {
        console.warn('BOT_TOKEN не установлен, бот не запущен');
    }

    app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
}).catch((err) => {
    console.error('Ошибка Базы:', err.message);
    process.exit(1);
});
