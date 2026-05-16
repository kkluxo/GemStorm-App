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
    const usernameText = order.user_username ? `@${order.user_username}` : 'Нет юзернейма';
    
    const message = `🆕 НОВЫЙ ЗАКАЗ #${order.order_number}\n\n` +
        `Сумма: ${order.total} руб.\n` +
        `Клиент: ${order.user_name || 'Не указан'} (${usernameText})\n` + // Добавили юзернейм
        `ID: ${order.user_id || 'Не указан'}\n` +
        `Метод оплаты: ${order.payment_method || 'Не указан'}\n` +
        `Дата: ${order.date} ${order.time}`;
    
    await bot.telegram.sendMessage(ADMIN_ID, message);
}

// Уведомление пользователя
async function notifyUser(bot, order) {
    try {
        const message = `✅ Ваш заказ #${order.order_number} принят!\n\n` +
            `Сумма: ${order.total} руб.\n` +
            `Статус: ${order.status || 'Ожидает проверки'}\n\n` +
            `Спасибо за покупку!`;
        
        await bot.telegram.sendMessage(order.user_id, message);
    } catch(e) {
        console.error('Не удалось уведомить пользователя:', e.message);
    }
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
        
        // Внутри функции initDB после создания таблицы orders
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_username TEXT');

        // Добавление колонки verification_code если её нет
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_code TEXT');
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_item_name TEXT');
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_item_category TEXT');

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
            try {
                const bot = new Telegraf(BOT_TOKEN);
                await bot.telegram.sendMessage(
                    order.user_id, 
                    `📦 Статус заказа #${order.order_number} изменён: ${status}`
                );
            } catch(e) {
                console.error('Не удалось уведомить пользователя:', e.message);
            }
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

// Регистрация/обновление пользователя при входе в приложение
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
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить всех пользователей
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                au.user_id,
                au.user_name,
                au.user_username,
                au.photo_url,
                au.first_seen,
                au.last_seen,
                COALESCE(o.orders_count, 0) as orders_count,
                COALESCE(o.total_spent, 0) as total_spent
            FROM app_users au
            LEFT JOIN (
                SELECT 
                    user_id,
                    COUNT(*) as orders_count,
                    SUM(total) as total_spent
                FROM orders
                WHERE user_id IS NOT NULL
                GROUP BY user_id
            ) o ON au.user_id = o.user_id
            ORDER BY o.total_spent DESC NULLS LAST, au.first_seen DESC
        `);
        res.json(result.rows);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить настройки
app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings WHERE id = 1');
        if (!result.rows.length) {
            res.json({ bot_status: 'open', work_start: '10:00', work_end: '23:59' });
        } else {
            res.json(result.rows[0]);
        }
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Обновить настройки
app.post('/api/settings', async (req, res) => {
    try {
        const { bot_status } = req.body;
        await pool.query(`
            INSERT INTO settings (id, bot_status) VALUES (1, $1)
            ON CONFLICT (id) DO UPDATE SET bot_status = $1
        `, [bot_status]);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Удалить отзыв
app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        res.json({ success: true });
    } catch(err) {
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

app.get('/api/stats', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const week = new Date(today); week.setDate(week.getDate() - 7);

        const todayStr = today.toLocaleDateString('ru-RU');
        const weekAgo = week.toISOString();

        // Статистика за день
        const dayOrders = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE date = $1`, [todayStr]);
        const dayUsers = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE date = $1`, [todayStr]);

        // Статистика за 7 дней
        const weekOrders = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE timestamp >= $1`, [weekAgo]);
        const weekUsers = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE timestamp >= $1`, [weekAgo]);

        // Всё время
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