// ID админа (твой Telegram ID)
const ADMIN_ID = 7509324385;

// Проверка, является ли пользователь админом
function isAdmin() {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    return user.id == ADMIN_ID;
  }
  return false;
}

// Получение всех заказов для админа
function getAdminOrders() {
  try {
    return JSON.parse(localStorage.getItem('admin_orders') || '[]');
  } catch (e) {
    return [];
  }
}

// Обновление статуса заказа
function updateOrderStatus(orderId, newStatus, newStatusCode) {
  let orders = getAdminOrders();
  const orderIndex = orders.findIndex(o => o.id == orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    orders[orderIndex].statusCode = newStatusCode;
    localStorage.setItem('admin_orders', JSON.stringify(orders));
    
    // Отправляем уведомление пользователю, если нужно
    if (window.Telegram?.WebApp) {
      // Можно отправить сообщение пользователю через бота
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: 'order_status_update',
        orderId: orderId,
        status: newStatus
      }));
    }
    
    // Обновляем админ-панель
    renderAdminPanel();
  }
}

// Рендер админ-панели
function renderAdminPanel() {
  const container = document.getElementById("adminContent");
  if (!container) return;
  
  const orders = getAdminOrders();
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state-icon">
        <img class="empty-icon" src="https://storage.botpapa.me/files/8a684130-49e6-11f1-bef9-f1ec7a2c6e45.png" alt="empty">
        <div class="empty-title">Заказов пока нет</div>
      </div>
    `;
    return;
  }
  
  // Статистика
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.statusCode === 'pending').length;
  
  container.innerHTML = `
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-value">${totalOrders}</div>
        <div class="stat-label">Всего заказов</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatPrice(totalAmount)}</div>
        <div class="stat-label">На сумму</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${pendingOrders}</div>
        <div class="stat-label">В обработке</div>
      </div>
    </div>
    
    <div class="admin-orders-list">
      ${orders.map(order => `
        <div class="admin-order-card" data-order-id="${order.id}">
          <div class="admin-order-header">
            <div>
              <span class="admin-order-id">Заказ #${order.orderNumber}</span>
              <span class="admin-order-date">${order.date} ${order.time}</span>
            </div>
            <select class="admin-status-select" data-order-id="${order.id}" data-status="${order.statusCode}">
              <option value="pending" ${order.statusCode === 'pending' ? 'selected' : ''}>🟡 Ожидает проверки</option>
              <option value="confirmed" ${order.statusCode === 'confirmed' ? 'selected' : ''}>✅ Подтверждён</option>
              <option value="shipped" ${order.statusCode === 'shipped' ? 'selected' : ''}>📦 Отправлен</option>
              <option value="completed" ${order.statusCode === 'completed' ? 'selected' : ''}>🎉 Выполнен</option>
              <option value="cancelled" ${order.statusCode === 'cancelled' ? 'selected' : ''}>❌ Отменён</option>
            </select>
          </div>
          
          <div class="admin-order-user">
            <strong>👤 ${escapeHtml(order.senderName || 'Не указан')}</strong>
            ${order.user?.username ? `<span class="admin-user-tag">@${order.user.username}</span>` : ''}
          </div>
          
          <div class="admin-order-details">
            <div>📧 ${escapeHtml(order.email || '—')}</div>
            <div>💳 ${order.paymentMethod || '—'}</div>
            <div>🎫 ${order.promo ? order.promo + ` (скидка ${order.promoDiscount}%)` : '—'}</div>
          </div>
          
          <div class="admin-order-items">
            ${order.items.map(item => `
              <div class="admin-order-item">
                <span>${escapeHtml(item.name)} x${item.qty}</span>
                <span>${formatPrice(item.price * item.qty)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="admin-order-total">
            <span>💰 Итого:</span>
            <strong>${formatPrice(order.total)}</strong>
          </div>
          
          <div class="admin-order-actions">
            <button class="admin-contact-btn" data-user-id="${order.user?.id || ''}" data-username="${order.user?.username || ''}">
              💬 Связаться
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Добавляем обработчики
  document.querySelectorAll('.admin-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      e.stopPropagation();
      const orderId = parseInt(select.dataset.orderId);
      const newStatus = select.options[select.selectedIndex].text;
      const newStatusCode = select.value;
      updateOrderStatus(orderId, newStatus, newStatusCode);
    });
  });
  
  document.querySelectorAll('.admin-contact-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const username = btn.dataset.username;
      if (username) {
        window.open(`https://t.me/${username}`, '_blank');
      } else if (btn.dataset.userId) {
        window.open(`tg://user?id=${btn.dataset.userId}`, '_blank');
      }
    });
  });
  
  document.querySelectorAll('.admin-order-card').forEach(card => {
    card.addEventListener('click', () => {
      const orderId = parseInt(card.dataset.orderId);
      showOrderDetail(orderId);
    });
  });
}

// Добавляем админ-панель в приложение
function addAdminPage() {
  // Проверяем, есть ли уже админ-страница
  if (document.getElementById('admin-page')) return;
  
  // Создаём админ-страницу
  const adminPage = document.createElement('div');
  adminPage.id = 'admin-page';
  adminPage.className = 'page';
  adminPage.innerHTML = `
    <div class="header-row">
      <img class="header-icon-img" src="https://storage.botpapa.me/files/12337af0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin">
      <div class="page-title">📊 Админ-панель</div>
    </div>
    <div id="adminContent"></div>
  `;
  document.body.appendChild(adminPage);
  
  // Добавляем кнопку в меню для админа
  const bottomMenu = document.querySelector('.bottom-menu');
  const adminMenuItem = document.createElement('button');
  adminMenuItem.className = 'menu-item';
  adminMenuItem.setAttribute('data-page', 'admin');
  adminMenuItem.innerHTML = `
    <img class="menu-icon menu-icon-inactive" src="https://storage.botpapa.me/files/1656bed0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width: 28px; height: 28px;">
    <img class="menu-icon menu-icon-active" src="https://storage.botpapa.me/files/12337af0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width: 28px; height: 28px;">
    <span class="menu-label">Админ</span>
  `;
  bottomMenu.appendChild(adminMenuItem);
  
  // Добавляем обработчик
  adminMenuItem.addEventListener('click', () => {
    hapticLight();
    if (isAdmin()) {
      showPage('admin');
      renderAdminPanel();
    } else {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('⛔ У вас нет доступа к админ-панели');
      }
    }
  });
}

// Инициализация админ-функций
function initAdmin() {
  addAdminPage();
  
  // Слушаем обновления заказов
  window.addEventListener('adminOrdersUpdated', () => {
    if (document.getElementById('admin-page').classList.contains('active-page') && isAdmin()) {
      renderAdminPanel();
    }
  });
  
  // Экспортируем функции в глобальный объект
  window.adminFunctions = {
    getAdminOrders,
    updateOrderStatus,
    renderAdminPanel,
    isAdmin
  };
}

// Запускаем инициализацию после загрузки страницы
document.addEventListener('DOMContentLoaded', initAdmin);