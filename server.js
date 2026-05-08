const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

console.log('🚀 Запуск сервера...');
console.log('BOT_TOKEN:', BOT_TOKEN ? '✅ Установлен' : '❌ НЕ УСТАНОВЛЕН');

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Файл для хранения заказов
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Функция загрузки заказов из файла
function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`📂 Загружено ${parsed.length} заказов из файла`);
      return parsed;
    }
  } catch (err) {
    console.error('Ошибка загрузки заказов:', err);
  }
  return [];
}

// Функция сохранения заказов в файл
function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    console.log(`💾 Сохранено ${orders.length} заказов в файл`);
  } catch (err) {
    console.error('Ошибка сохранения заказов:', err);
  }
}

// Инициализация хранилища
let orders = loadOrders();

// API: проверка статуса
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', bot: !!BOT_TOKEN, ordersCount: orders.length });
});

// API: получить ВСЕ заказы (для админа)
app.get('/api/orders', (req, res) => {
  console.log(`📋 Админ запросил заказы, всего: ${orders.length}`);
  res.json(orders);
});

// API: получить заказы пользователя
app.get('/api/user-orders', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.json([]);
  const userOrders = orders.filter(o => o.user_id == userId);
  console.log(`👤 Пользователь ${userId} запросил заказы, найдено: ${userOrders.length}`);
  res.json(userOrders);
});

// API: создать новый заказ
app.post('/api/order', async (req, res) => {
  try {
    const order = req.body;
    
    // Добавляем ID и дату
    order.id = Date.now();
    order.createdAt = new Date().toISOString();
    order.status = '🟡 Ожидает проверки';
    order.status_code = 'pending';
    
    // Сохраняем в массив и в файл
    orders.unshift(order);
    saveOrders(orders);
    
    console.log(`📦 НОВЫЙ ЗАКАЗ #${order.orderNumber}`);
    console.log(`   От: ${order.sender_name}`);
    console.log(`   Сумма: ${order.total}₽`);
    console.log(`   Всего заказов в базе: ${orders.length}`);
    
    // Отправляем уведомление админу в Telegram
    if (BOT_TOKEN) {
      const bot = new Telegraf(BOT_TOKEN);
      
      const itemsList = order.items.map(item => 
        `└ ${item.name} x${item.qty} — ${item.price * item.qty}₽`
      ).join('\n');
      
      const message = `🛒 *НОВЫЙ ЗАКАЗ #${order.orderNumber}*

👤 *Покупатель:* ${order.sender_name || 'Не указан'}
📧 *Email:* ${order.email || 'Не указан'}
💳 *Оплата:* ${order.payment_method || 'Не указан'}

📦 *Товары:*
${itemsList}

💰 *Итого:* ${order.total}₽

🕐 *Время:* ${order.date} ${order.time}`;
      
      await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: 'Markdown' });
      console.log(`✅ Уведомление отправлено админу (${ADMIN_ID})`);
      
      // Отправляем подтверждение пользователю
      if (order.user_id) {
        try {
          await bot.telegram.sendMessage(order.user_id,
            `✅ *Ваш заказ #${order.orderNumber} получен!*

📦 *Состав заказа:*
${itemsList}

💰 *Сумма:* ${order.total}₽

Администратор проверит оплату и свяжется с вами.`,
            { parse_mode: 'Markdown' }
          );
          console.log(`✅ Подтверждение отправлено пользователю ${order.user_id}`);
        } catch(e) {
          console.log(`⚠️ Не удалось отправить пользователю: ${e.message}`);
        }
      }
    }
    
    res.json({ success: true, orderId: order.id });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: обновить статус заказа
app.post('/api/update-status', async (req, res) => {
  try {
    const { orderId, status, statusCode } = req.body;
    
    const orderIndex = orders.findIndex(o => o.id == orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      orders[orderIndex].status_code = statusCode;
      saveOrders(orders);
      console.log(`📝 Обновлён статус заказа #${orders[orderIndex].orderNumber}: ${status}`);
      
      // Отправляем уведомление пользователю
      if (BOT_TOKEN && orders[orderIndex].user_id) {
        const bot = new Telegraf(BOT_TOKEN);
        await bot.telegram.sendMessage(orders[orderIndex].user_id,
          `🔄 Статус вашего заказа #${orders[orderIndex].orderNumber} изменён на: *${status}*`,
          { parse_mode: 'Markdown' }
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📋 Загружено заказов: ${orders.length}`);
});

// Форматирование цены
function formatPrice(p) {
  return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "₽";
}