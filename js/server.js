const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Токен бота из переменных окружения Railway
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7509324385; // Твой Telegram ID

if (!BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не задан в переменных окружения!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Раздаём все файлы (index.html, css, js)

// Эндпоинт для отправки заказа админу
app.post('/api/send-order', async (req, res) => {
  try {
    const { order } = req.body;
    
    // Формируем красивое сообщение
    let itemsList = order.items.map(item => 
      `└ ${item.name} x${item.qty} — ${formatPrice(item.price * item.qty)}`
    ).join('\n');
    
    const message = `
🛒 *НОВЫЙ ЗАКАЗ #${order.orderNumber}*

👤 *Покупатель:* ${order.senderName || 'Не указан'}
📧 *Email:* ${order.email || 'Не указан'}
💳 *Оплата:* ${order.paymentMethod || 'Не указан'}

📦 *Товары:*
${itemsList}

💰 *Итого:* ${formatPrice(order.total)}
🎫 *Промокод:* ${order.promo || 'Не использован'}

🕐 *Время:* ${order.date} ${order.time}
    `;
    
    // Отправляем админу в Telegram
    await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: 'Markdown' });
    
    // Если у пользователя есть Telegram ID, отправляем ему подтверждение
    if (order.user?.id) {
      await bot.telegram.sendMessage(order.user.id, 
        `✅ Ваш заказ #${order.orderNumber} получен!\n\nАдминистратор проверит оплату и свяжется с вами в ближайшее время.`
      );
    }
    
    console.log(`✅ Заказ #${order.orderNumber} отправлен админу`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Ошибка отправки заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

// Эндпоинт для обновления статуса заказа
app.post('/api/update-status', async (req, res) => {
  try {
    const { orderId, status, userId, userName } = req.body;
    
    if (userId) {
      await bot.telegram.sendMessage(userId,
        `🔄 Статус вашего заказа #${orderId} изменён на: ${status}\n\nСледите за обновлениями в приложении.`
      );
      console.log(`📢 Уведомление отправлено пользователю ${userName || userId} о статусе заказа #${orderId}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    res.status(500).json({ error: error.message });
  }
});

// Команда /start для бота
bot.start((ctx) => {
  ctx.reply('👋 Добро пожаловать в Geltan Store!\n\nОткройте приложение, чтобы сделать заказ.');
});

// Команда /help
bot.help((ctx) => {
  ctx.reply('📚 Помощь:\n\n1. Выберите товары в каталоге\n2. Оформите заказ в корзине\n3. Оплатите по реквизитам\n4. Нажмите "Я оплатил"\n\nПосле проверки оплаты мы свяжемся с вами!');
});

// Запуск бота
bot.launch().then(() => {
  console.log('🤖 Бот успешно запущен!');
}).catch((err) => {
  console.error('❌ Ошибка запуска бота:', err);
});

// Функция форматирования цены
function formatPrice(p) {
  return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "₽";
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 Открой: http://localhost:${PORT}`);
});

// Обработка завершения работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));