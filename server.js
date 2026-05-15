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

// Функция для получения следующего номера заказа
async function getNextOrderNumber() {
    const result = await pool.query('SELECT COALESCE(MAX(order_number), 0) + 1 as next FROM orders');
    return result.rows[0].next;
}

// Уведомление администратора
async function notifyAdmin(bot, order) {
    const message = `🆕 НОВЫЙ ЗАКАЗ #${order.order_number}\n\n` +
        `Сумма: ${order.total} руб.\n` +
        `Клиент: ${order.user_name || 'Не указан'}\n` +
        `ID: ${order.user_id || 'Не указан'}\n` +
        `Метод оплаты: ${order.payment_method || 'Не указан'}\n` +
        `Дата: ${order.date} ${order.time}`;
    
    await bot.telegram.sendMessage(ADMIN_ID, message);
}

// Уведомление пользователя
async function notifyUser(bot, order) {
    const message = `✅ Ваш заказ #${order.order_number} принят!\n\n` +
        `Сумма: ${order.total} руб.\n` +
        `Статус: ${order.status || 'Ожидает проверки'}\n\n` +
        `Спасибо за покупку!`;
    
    await bot.telegram.sendMessage(order.user_id, message);
}

// Инициализация базы данных
async function initDB() {
    try {
        // Таблица orders
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
                status TEXT DEFAULT 'Ожидание проверки',
                status_code TEXT DEFAULT 'pending',
                verification_code TEXT
            )
        `);
        console.log('Таблица orders готова');

        // Добавление колонки verification_code если её нет
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_code TEXT');
        
        // Таблица referrals
        await pool.query(`
            CREATE TABLE IF NOT EXISTS referrals (
                id SERIAL PRIMARY KEY,
                user_id TEXT UNIQUE,
                referred_by TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Таблица referral_balances
        await pool.query(`
            CREATE TABLE IF NOT EXISTS referral_balances (
                id SERIAL PRIMARY KEY,
                user_id TEXT UNIQUE,
                balance INTEGER DEFAULT 0
            )
        `);
        
        // Таблица referral_promocodes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS referral_promocodes (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                code TEXT UNIQUE,
                amount INTEGER,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Таблица referral_conversions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS referral_conversions (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                code TEXT,
                amount INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Таблица reviews
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                user_name TEXT,
                photo_url TEXT,
                text TEXT,
                stars INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id INTEGER`);
        await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_number INTEGER`);

        console.log('Все таблицы готовы');
        
        const result = await pool.query('SELECT COUNT(*) as count FROM orders');
        console.log(`В базе данных ${result.rows[0].count} заказов`);
    } catch (err) {
        console.error('Ошибка инициализации БД:', err.message);
        throw err;
    }
}

// ==== API ЭНДПОИНТЫ ====

app.get('/api/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM orders');
        res.json({ 
            status: 'ok', 
            bot: !!BOT_TOKEN, 
            ordersCount: parseInt(result.rows[0].count) 
        });
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

app.post('/api/order', async (req, res) => {
    try {
        const o = req.body;
        const nextNumber = await getNextOrderNumber();
        
        const result = await pool.query(
            `INSERT INTO orders (
                order_number, date, time, timestamp, items, total, promo, 
                promo_discount, payment_method, sender_name, email, user_id, user_name
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [
                nextNumber, o.date, o.time, o.timestamp, JSON.stringify(o.items), o.total, 
                o.promo || null, o.promo_discount || 0, o.payment_method || null,
                o.sender_name || null, o.email || null, o.user_id || null, o.user_name || null
            ]
        );
        
        const saved = result.rows[0];
        console.log(`Заказ #${saved.order_number} сохранён`);
        
        if (BOT_TOKEN) {
            const bot = new Telegraf(BOT_TOKEN);
            await notifyAdmin(bot, saved);
            if (saved.user_id) {
                await notifyUser(bot, saved);
            }
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
        
        let finalStatusCode = statusCode;
        
        if (!finalStatusCode || finalStatusCode === 'pending') {
            const statusMap = {
                'Ожидание проверки': 'pending',
                'Проверка перевода': 'pending',
                'Ожидание кода': 'awaiting_code',
                'Ожидает выполнения': 'processing',
                'Выполнен': 'completed',
                'Отменён': 'cancelled'
            };
            
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
            await bot.telegram.sendMessage(
                order.user_id, 
                `📦 Статус заказа #${order.order_number} изменён: ${status}`
            );
        }
        
        if (finalStatusCode === 'completed') {
            try {
                const refRow = await pool.query(
                    'SELECT referred_by FROM referrals WHERE user_id = $1',
                    [order.user_id]
                );
                
                if (refRow.rows.length && refRow.rows[0].referred_by) {
                    const referrerId = refRow.rows[0].referred_by;
                    const bonus = Math.round(order.total * 0.02);
                    
                    if (bonus > 0) {
                        await pool.query(
                            `INSERT INTO referral_balances (user_id, balance) 
                             VALUES ($1, $2) 
                             ON CONFLICT (user_id) DO UPDATE SET balance = referral_balances.balance + $2`,
                            [referrerId, bonus]
                        );
                        
                        if (BOT_TOKEN) {
                            const bot = new Telegraf(BOT_TOKEN);
                            await bot.telegram.sendMessage(
                                referrerId,
                                `🎉 Вам начислено ${bonus}₽ за покупку вашего реферала (заказ #${order.order_number})`
                            );
                        }
                    }
                }
            } catch(e) {
                console.error('Ошибка начисления бонуса:', e.message);
            }
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
        
        const result = await pool.query(
            'UPDATE orders SET verification_code = $1, status = $2, status_code = $3 WHERE id = $4 RETURNING *',
            [code, 'Ожидает выполнения', 'processing', orderId]
        );
        
        if (!result.rows.length) return res.status(404).json({ error: 'Заказ не найден' });
        
        if (BOT_TOKEN) {
            const bot = new Telegraf(BOT_TOKEN);
            await bot.telegram.sendMessage(
                ADMIN_ID, 
                `🔑 НОВЫЙ КОД ДЛЯ ЗАКАЗА #${result.rows[0].order_number}\nКод: ${code}`
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

app.post('/api/register-referral', async (req, res) => {
    try {
        const { userId, referrerId } = req.body;
        if (!userId || !referrerId || userId === referrerId) return res.json({ success: false });
        
        await pool.query(
            `INSERT INTO referrals (user_id, referred_by) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
            [userId, referrerId]
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/referral-stats', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.json({ count: 0, balance: 0, referrals: [] });
        
        const countResult = await pool.query(
            'SELECT COUNT(*) as count FROM referrals WHERE referred_by = $1',
            [userId]
        );
        
        const balanceResult = await pool.query(
            'SELECT balance FROM referral_balances WHERE user_id = $1',
            [userId]
        );
        
        const referralsResult = await pool.query(
            `SELECT r.user_id, r.created_at,
             COALESCE(SUM(CASE WHEN o.status_code = 'completed' THEN ROUND(o.total * 0.02) ELSE 0 END), 0) as earned
             FROM referrals r
             LEFT JOIN orders o ON o.user_id = r.user_id AND o.status_code = 'completed'
             WHERE r.referred_by = $1
             GROUP BY r.user_id, r.created_at
             ORDER BY r.created_at DESC`,
            [userId]
        );
        
        res.json({ 
            count: parseInt(countResult.rows[0].count), 
            balance: balanceResult.rows[0]?.balance || 0, 
            referrals: referralsResult.rows 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/convert-balance', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        
        const balanceResult = await pool.query('SELECT balance FROM referral_balances WHERE user_id = $1', [userId]);
        const balance = balanceResult.rows[0]?.balance || 0;
        
        if (balance <= 0) return res.status(400).json({ error: 'Баланс пуст' });
        
        const code = 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase();
        
        await pool.query(
            'INSERT INTO referral_promocodes (user_id, code, amount) VALUES ($1, $2, $3)',
            [userId, code, balance]
        );
        
        await pool.query(
            'UPDATE referral_balances SET balance = 0 WHERE user_id = $1',
            [userId]
        );
        
        await pool.query(
            'INSERT INTO referral_conversions (user_id, code, amount) VALUES ($1, $2, $3)',
            [userId, code, balance]
        );
        
        res.json({ success: true, code, amount: balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/check-referral-promo', async (req, res) => {
    try {
        const { code, userId } = req.body;
        if (!code || !userId) return res.status(400).json({ error: 'Нет данных' });
        
        const result = await pool.query(
            'SELECT * FROM referral_promocodes WHERE code = $1 AND user_id = $2 AND used = FALSE',
            [code, userId]
        );
        
        if (!result.rows.length) return res.json({ valid: false });
        res.json({ valid: true, amount: result.rows[0].amount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/use-referral-promo', async (req, res) => {
    try {
        const { code, userId } = req.body;
        
        const result = await pool.query(
            'UPDATE referral_promocodes SET used = TRUE WHERE code = $1 AND user_id = $2 AND used = FALSE RETURNING *',
            [code, userId]
        );
        
        if (!result.rows.length) return res.json({ success: false });
        res.json({ success: true, amount: result.rows[0].amount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/conversion-history', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.json([]);
        
        const result = await pool.query(
            `SELECT rc.code, rc.amount, rc.created_at, COALESCE(rp.used, false) as used 
             FROM referral_conversions rc
             LEFT JOIN referral_promocodes rp ON rc.code = rp.code
             WHERE rc.user_id = $1
             ORDER BY rc.created_at DESC`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Рейтинг пользователей
app.get('/api/rating', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, user_name, COALESCE(SUM(total), 0) as total_spent
             FROM orders 
             WHERE status_code = 'completed'
             GROUP BY user_id, user_name
             ORDER BY total_spent DESC
             LIMIT 100`
        );
        res.json(result.rows);
    } catch(err) {
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
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Отзывы - добавить новый
app.post('/api/reviews', async (req, res) => {
    try {
        const { userId, userName, photoUrl, text, orderId, orderNumber } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Текст обязателен' });
        }
        
        await pool.query(
  'INSERT INTO reviews (user_id, user_name, photo_url, text, order_id, order_number) VALUES ($1,$2,$3,$4,$5,$6)',
  [userId || null, userName || 'Пользователь', photoUrl || null, text.trim(), orderId || null, orderNumber || null]
);
        
        // Уведомить админа об отзыве
        if (BOT_TOKEN) {
            try {
                const bot = new Telegraf(BOT_TOKEN);
                await bot.telegram.sendMessage(
                    ADMIN_ID, 
                    `⭐ Новый отзыв от ${userName || 'Пользователь'}\nОценка: ${starsVal}/5\nТекст: ${text.substring(0, 100)}`
                );
            } catch(e) {}
        }
        
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Запуск сервера
initDB().then(() => {
    app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
}).catch((err) => {
    console.error('Ошибка Базы:', err.message);
    process.exit(1);
});