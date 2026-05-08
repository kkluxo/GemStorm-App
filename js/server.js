const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385;

console.log('🚀 Запуск сервера...');
console.log('PORT:', PORT);
console.log('BOT_TOKEN:', BOT_TOKEN ? '✅ Установлен' : '❌ НЕ УСТАНОВЛЕН');
console.log('ADMIN_ID:', ADMIN_ID);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Хранилище заказов (в памяти, перезагружается при перезапуске)
let orders = [];

// ========== API ENDPOINTS ==========

// Проверка статуса сервера
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    bot: !!BOT_TOKEN, 
    ordersCount: orders.length,
    timestamp: new Date().toISOString()
  });
});

// Получить все заказы (для админа)
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Получить заказы конкретного пользователя
app.get('/api/user-orders', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.json([]);
  }
  const userOrders = orders.filter(o => o.user_id == userId);
  res.json(userOrders);
});

// Создать новый заказ
app.post('/api/order', async (req, res) => {
  try {
    const order = req.body;
    
    // Добавляем ID и дату
    order.id = Date.now();
    order.createdAt = new Date().toISOString();
    orders.unshift(order);
    
    console.log(`📦 Новый заказ #${order.orderNumber} от ${order.sender_name}`);
    console.log(`💰 Сумма: ${order.total}₽, Товаров: ${order.items.length}`);
    
    // Отправляем уведомление админу в Telegram
    if (BOT_TOKEN && bot) {
      const itemsList = order.items.map(item => 
        `└ ${item.name} x${item.qty} — ${formatPrice(item.price * item.qty)}`
      ).join('\n');
      
      const message = `
🛒 *НОВЫЙ ЗАКАЗ #${order.orderNumber}*

👤 *Покупатель:* ${order.sender_name || 'Не указан'}
📧 *Email:* ${order.email || 'Не указан'}
💳 *Оплата:* ${order.payment_method || 'Не указан'}

📦 *Товары:*
${itemsList}

💰 *Итого:* ${formatPrice(order.total)}
🎫 *Промокод:* ${order.promo || 'Не использован'}

🕐 *Время:* ${order.date} ${order.time}
      `;
      
      await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: 'Markdown' });
      console.log(`✅ Уведомление отправлено админу (${ADMIN_ID})`);
      
      // Отправляем подтверждение пользователю
      if (order.user_id) {
        try {
          await bot.telegram.sendMessage(order.user_id, 
            `✅ Ваш заказ #${order.orderNumber} получен!\n\nСумма: ${formatPrice(order.total)}\n\nАдминистратор проверит оплату и свяжется с вами.`
          );
          console.log(`✅ Подтверждение отправлено пользователю ${order.user_id}`);
        } catch(e) {
          console.log(`⚠️ Не удалось отправить сообщение пользователю ${order.user_id}:`, e.message);
        }
      }
    } else {
      console.log('⚠️ Бот не настроен, уведомление не отправлено');
    }
    
    res.json({ success: true, orderId: order.id });
    
  } catch (error) {
    console.error('❌ Ошибка при создании заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновление статуса заказа
app.post('/api/update-status', async (req, res) => {
  try {
    const { orderId, status, statusCode } = req.body;
    
    const order = orders.find(o => o.id == orderId);
    if (order) {
      order.status = status;
      order.status_code = statusCode;
      
      // Отправляем уведомление пользователю
      if (BOT_TOKEN && bot && order.user_id) {
        await bot.telegram.sendMessage(order.user_id, 
          `🔄 Статус вашего заказа #${order.orderNumber} изменён на: ${status}\n\nСледите за обновлениями в приложении.`
        );
        console.log(`✅ Уведомление об изменении статуса отправлено пользователю ${order.user_id}`);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка обновления статуса:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== БОТ ==========

let bot = null;
if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);
  
  bot.start((ctx) => {
    const userName = ctx.from.first_name || 'пользователь';
    ctx.reply(`👋 Добро пожаловать в GemStorm Store, ${userName}!\n\nОткройте приложение, чтобы сделать заказ:\n👉 https://kkluxo.github.io/GemStorm-App`);
    console.log(`📨 /start от пользователя ${ctx.from.id} (${ctx.from.username})`);
  });
  
  bot.help((ctx) => {
    ctx.reply(`📚 Как сделать заказ:

1️⃣ Выберите товары в каталоге
2️⃣ Перейдите в корзину
3️⃣ Оформите заказ (укажите почту и способ оплаты)
4️⃣ Оплатите по реквизитам
5️⃣ Нажмите "Я оплатил"

После проверки оплаты мы свяжемся с вами!

📢 Наш канал: https://t.me/GemStormStore
🆘 Поддержка: https://t.me/GemStormHelp`);
  });
  
  bot.launch().then(() => {
    console.log('🤖 Бот успешно запущен!');
  }).catch((err) => {
    console.error('❌ Ошибка запуска бота:', err);
  });
} else {
  console.log('⚠️ BOT_TOKEN не задан, бот не запущен');
}

// ========== ЗАПУСК СЕРВЕРА ==========

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 API доступен по адресу: https://gemstorm-app.up.railway.app`);
});

// Форматирование цены
function formatPrice(p) {
  return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "₽";
}

// Обработка завершения
process.once('SIGINT', () => {
  if (bot) bot.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  if (bot) bot.stop('SIGTERM');
  process.exit(0);
});