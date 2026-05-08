let adminOrders = [];
let adminCurrentFilter = 'all';

function initAdminPanel() {
  loadAdminOrders();
  
  document.getElementById('adminRefreshBtn')?.addEventListener('click', () => {
    loadAdminOrders();
  });
  
  document.querySelectorAll('.admin-filter-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.admin-filter-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      adminCurrentFilter = this.dataset.filter;
      renderAdminOrders();
    });
  });
  
  document.getElementById('adminCloseModal')?.addEventListener('click', () => {
    document.getElementById('adminModal').classList.remove('open');
  });
  
  document.getElementById('adminModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('adminModal')) {
      document.getElementById('adminModal').classList.remove('open');
    }
  });
  
  setInterval(loadAdminOrders, 30000);
}

async function loadAdminOrders() {
  const refreshBtn = document.getElementById('adminRefreshBtn');
  if (refreshBtn) {
    refreshBtn.textContent = '↻ Загрузка...';
    refreshBtn.disabled = true;
  }
  
  try {
    const response = await fetch('https://gemstorm-app-production.up.railway.app/api/orders');
    if (response.ok) {
      adminOrders = await response.json();
      updateAdminStats();
      renderAdminOrders();
    }
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
  }
  
  if (refreshBtn) {
    refreshBtn.textContent = '↻ Обновить';
    refreshBtn.disabled = false;
  }
}

function updateAdminStats() {
  document.getElementById('adminStatTotal').textContent = adminOrders.length;
  document.getElementById('adminStatPending').textContent = adminOrders.filter(o => o.status_code === 'pending').length;
  document.getElementById('adminStatDone').textContent = adminOrders.filter(o => o.status_code === 'done').length;
}

function renderAdminOrders() {
  const container = document.getElementById('adminOrdersList');
  if (!container) return;
  
  let filtered = adminOrders;
  if (adminCurrentFilter !== 'all') {
    filtered = adminOrders.filter(o => o.status_code === adminCurrentFilter);
  }
  
  if (!filtered.length) {
    container.innerHTML = `<div style="text-align:center;padding:60px;color:#9e9e9e">📭 Заказов нет</div>`;
    return;
  }
  
  container.innerHTML = filtered.map(order => {
    let itemsText = '';
    try {
      const items = JSON.parse(order.items || '[]');
      itemsText = items.map(i => `${i.name} ×${i.qty}`).join(', ');
    } catch(e) { itemsText = '—'; }
    
    let statusClass = '';
    if (order.status_code === 'pending') statusClass = 'admin-status-pending';
    else if (order.status_code === 'done') statusClass = 'admin-status-done';
    else if (order.status_code === 'canceled') statusClass = 'admin-status-canceled';
    else statusClass = 'admin-status-pending';
    
    return `
      <div class="admin-order-card" data-order-id="${order.id}">
        <div class="admin-order-top">
          <div class="admin-order-num">Заказ #${order.order_number}</div>
          <div class="admin-status ${statusClass}">${order.status || '🟡 Ожидает'}</div>
        </div>
        <div class="admin-order-user">👤 ${escapeHtml(order.sender_name || '—')} | ${escapeHtml(order.user_username || 'без username')}</div>
        <div class="admin-order-user">📦 ${escapeHtml(itemsText)}</div>
        <div class="admin-order-user">📅 ${order.date} ${order.time || ''}</div>
        <div class="admin-order-total">${formatPrice(order.total)}</div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('.admin-order-card').forEach(card => {
    card.addEventListener('click', () => {
      const orderId = parseInt(card.dataset.orderId);
      const order = adminOrders.find(o => o.id === orderId);
      if (order) openAdminOrderModal(order);
    });
  });
}

function openAdminOrderModal(order) {
  let items = [];
  try { items = JSON.parse(order.items || '[]'); } catch(e) {}
  
  const itemsHtml = items.map(i => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a2a2e">
      <div>${escapeHtml(i.name)} ×${i.qty}</div>
      <div style="color:#4cb4e9">${formatPrice(i.price * i.qty)}</div>
    </div>
  `).join('');
  
  document.getElementById('adminModalContent').innerHTML = `
    <h3 style="margin-bottom:16px">Заказ #${order.order_number}</h3>
    
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="color:#9e9e9e">Покупатель:</span>
        <span>${escapeHtml(order.sender_name || '—')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="color:#9e9e9e">Telegram:</span>
        <span>${escapeHtml(order.user_username || '—')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="color:#9e9e9e">Email:</span>
        <span>${escapeHtml(order.email || '—')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="color:#9e9e9e">Оплата:</span>
        <span>${escapeHtml(order.payment_method || '—')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="color:#9e9e9e">Дата:</span>
        <span>${order.date} ${order.time || ''}</span>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="font-weight:600;margin-bottom:8px">Товары:</div>
      ${itemsHtml}
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700">
        <span>Итого:</span>
        <span style="color:#4cb4e9">${formatPrice(order.total)}</span>
      </div>
    </div>
    
    <div>
      <div style="font-weight:600;margin-bottom:8px">Сменить статус:</div>
      <div class="admin-status-buttons">
        <button class="admin-status-btn" data-status="🟡 Ожидает проверки" data-code="pending" style="background:rgba(251,191,36,0.1);color:#fbbf24">🟡 Ожидает</button>
        <button class="admin-status-btn" data-status="✅ Выполнен" data-code="done" style="background:rgba(74,222,128,0.1);color:#4ade80">✅ Выполнен</button>
        <button class="admin-status-btn" data-status="🔵 В обработке" data-code="processing" style="background:rgba(76,180,233,0.1);color:#4cb4e9">🔵 В обработке</button>
        <button class="admin-status-btn" data-status="❌ Отменен" data-code="canceled" style="background:rgba(248,113,113,0.1);color:#f87171">❌ Отменён</button>
      </div>
    </div>
  `;
  
  document.querySelectorAll('.admin-status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.status;
      const statusCode = btn.dataset.code;
      await updateAdminOrderStatus(order.id, status, statusCode);
      document.getElementById('adminModal').classList.remove('open');
      loadAdminOrders();
    });
  });
  
  document.getElementById('adminModal').classList.add('open');
}

async function updateAdminOrderStatus(orderId, status, statusCode) {
  try {
    const response = await fetch('https://gemstorm-app-production.up.railway.app/api/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status, statusCode })
    });
    
    if (!response.ok) {
      alert('Ошибка при обновлении статуса');
    }
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Ошибка соединения');
  }
}