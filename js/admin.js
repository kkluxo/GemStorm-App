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

// Загрузка заказов с сервера
async function loadAdminOrders() {
  try {
    const response = await fetch('https://gemstorm-app-production.up.railway.app/api/orders');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
  }
  return [];
}

// Обновление статуса заказа
async function updateOrderStatus(orderId, status, statusCode) {
  try {
    const response = await fetch('https://gemstorm-app.up.railway.app/api/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status, statusCode })
    });
    return response.ok;
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    return false;
  }
}

// Рендер админ-панели
async function renderAdminPanel() {
  const container = document.getElementById("adminContent");
  if (!container) return;
  
  // Проверяем, админ ли пользователь
  if (!isAdmin()) {
    container.innerHTML = `
      <div class="empty-state-icon">
        <div class="empty-title">⛔ Доступ запрещён</div>
        <div class="empty-subtitle">У вас нет прав для просмотра этой страницы</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '<div class="empty-title">Загрузка заказов...</div>';
  
  const orders = await loadAdminOrders();
  
  if (!orders || orders.length === 0) {
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
  const pendingOrders = orders.filter(o => o.status_code === 'pending').length;
  
  let html = `
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
  `;
  
  for (const order of orders) {
    const items = JSON.parse(order.items || '[]');
    
    html += `
      <div class="admin-order-card" data-order-id="${order.id}">
        <div class="admin-order-header">
          <div>
            <span class="admin-order-id">Заказ #${order.order_number}</span>
            <span class="admin-order-date">${order.date} ${order.time}</span>
          </div>
          <select class="admin-status-select" data-order-id="${order.id}" data-status="${order.status_code}">
            <option value="pending" ${order.status_code === 'pending' ? 'selected' : ''}>🟡 Ожидает проверки</option>
            <option value="confirmed" ${order.status_code === 'confirmed' ? 'selected' : ''}>✅ Подтверждён</option>
            <option value="completed" ${order.status_code === 'completed' ? 'selected' : ''}>🎉 Выполнен</option>
            <option value="cancelled" ${order.status_code === 'cancelled' ? 'selected' : ''}>❌ Отменён</option>
          </select>
        </div>
        
        <div class="admin-order-user">
          <strong>👤 ${escapeHtml(order.sender_name || 'Не указан')}</strong>
          ${order.user_username ? `<span class="admin-user-tag">@${order.user_username}</span>` : ''}
        </div>
        
        <div class="admin-order-details">
          <div>📧 ${escapeHtml(order.email || '—')}</div>
          <div>💳 ${order.payment_method || '—'}</div>
          <div>🎫 ${order.promo || '—'}</div>
        </div>
        
        <div class="admin-order-items">
          ${items.map(item => `
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
          <button class="admin-contact-btn" data-username="${order.user_username || ''}" data-userid="${order.user_id || ''}">
            💬 Связаться
          </button>
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
  
  // Добавляем обработчики
  document.querySelectorAll('.admin-status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      e.stopPropagation();
      const orderId = select.dataset.orderId;
      const newStatusText = select.options[select.selectedIndex].text;
      const newStatusCode = select.value;
      
      const success = await updateOrderStatus(orderId, newStatusText, newStatusCode);
      if (success) {
        // Обновляем панель
        renderAdminPanel();
      }
    });
  });
  
  document.querySelectorAll('.admin-contact-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const username = btn.dataset.username;
      if (username) {
        window.open(`https://t.me/${username}`, '_blank');
      } else if (btn.dataset.userid) {
        window.open(`tg://user?id=${btn.dataset.userid}`, '_blank');
      }
    });
  });
}

// Функция добавления админ-кнопки в меню (ТОЛЬКО ДЛЯ АДМИНА)
function addAdminButton() {
  if (!isAdmin()) return;
  
  const bottomMenu = document.querySelector('.bottom-menu');
  if (!bottomMenu) return;
  
  // Проверяем, есть ли уже кнопка админа
  if (document.querySelector('.menu-item[data-page="admin"]')) return;
  
  const adminMenuItem = document.createElement('button');
  adminMenuItem.className = 'menu-item';
  adminMenuItem.setAttribute('data-page', 'admin');
  adminMenuItem.innerHTML = `
    <img class="menu-icon menu-icon-inactive" src="https://storage.botpapa.me/files/1656bed0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width: 28px; height: 28px;">
    <img class="menu-icon menu-icon-active" src="https://storage.botpapa.me/files/12337af0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width: 28px; height: 28px;">
    <span class="menu-label">Админ</span>
  `;
  bottomMenu.appendChild(adminMenuItem);
  
  adminMenuItem.addEventListener('click', () => {
    hapticLight();
    showPage('admin');
    renderAdminPanel();
  });
}

// Создаём админ-страницу
function createAdminPage() {
  if (document.getElementById('admin-page')) return;
  
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
}

// Инициализация
function initAdmin() {
  createAdminPage();
  addAdminButton();
}