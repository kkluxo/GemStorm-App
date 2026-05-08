let orders = [];

function renderOrdersPage() {
  const container = document.getElementById("ordersList");
  if (!container) return;
  if (!orders.length) { 
    container.innerHTML = `
      <div class="empty-state-icon">
        <img class="empty-icon" src="https://storage.botpapa.me/files/8a684130-49e6-11f1-bef9-f1ec7a2c6e45.png" alt="empty orders">
        <div class="empty-title">Заказов еще нет</div>
        <button class="empty-catalog-btn" id="emptyOrdersToCatalog">Перейти в каталог</button>
      </div>
    `;
    setTimeout(() => {
      const btn = document.getElementById("emptyOrdersToCatalog");
      if(btn) btn.addEventListener("click", () => showPage("catalog"));
    }, 0);
    return; 
  }
  container.innerHTML = orders.map(o => `
    <div class="order-card" data-order-id="${o.id}">
      <div class="order-card-header">
        <span class="order-card-id">Заказ #${o.id}</span>
        <span class="order-card-status">${o.status}</span>
      </div>
      <div class="order-card-date">${o.date} ${o.time || ''}</div>
      <div class="order-card-products">${o.items.map(i => `${i.name} x ${i.qty}`).join(', ')}${o.promo ? ` (промокод: ${o.promo})` : ''}</div>
      <div class="order-card-total">${formatPrice(o.total)}</div>
    </div>
  `).join('');
  
  document.querySelectorAll(".order-card").forEach(item => {
    item.addEventListener("click", () => {
      hapticLight();
      showOrderDetail(parseInt(item.dataset.orderId));
    });
  });
}

function showOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  document.getElementById("orderDetailTitle").textContent = `Заказ #${order.id}`;
  const container = document.getElementById("orderDetailContent");
  
  let itemsHtml = order.items.map(i => `
    <div class="order-detail-item">
      <img class="order-detail-item-img" src="${i.image}" alt="${escapeHtml(i.name)}">
      <div class="order-detail-item-info">
        <div class="order-detail-item-name">${escapeHtml(i.name)}</div>
        <div class="order-detail-item-price">${formatPrice(i.price)}</div>
        <div class="order-detail-item-category">${escapeHtml(i.category)}</div>
      </div>
      <div class="order-detail-item-qty">${i.qty} шт.</div>
    </div>
  `).join('');
  
  container.innerHTML = `
    <div class="content-card">
      <div class="order-detail-row">
        <span class="order-detail-label">Статус</span>
        <span class="order-detail-value" style="color:#4cb4e9">${order.status}</span>
      </div>
      <div class="order-detail-row">
        <span class="order-detail-label">Дата</span>
        <span class="order-detail-value">${order.date} ${order.time || ''}</span>
      </div>
      <div class="order-detail-row">
        <span class="order-detail-label">Способ оплаты</span>
        <span class="order-detail-value">${order.paymentMethod || '—'}</span>
      </div>
      <div class="order-detail-row">
        <span class="order-detail-label">Отправитель</span>
        <span class="order-detail-value">${escapeHtml(order.senderName || '—')}</span>
      </div>
      <div class="order-detail-row">
        <span class="order-detail-label">Почта</span>
        <span class="order-detail-value">${escapeHtml(order.email || '—')}</span>
      </div>
      ${order.promo ? `<div class="order-detail-row"><span class="order-detail-label">Промокод</span><span class="order-detail-value">${order.promo}</span></div>` : ''}
      <div class="divider"></div>
      <div class="order-detail-total-row">
        <span class="order-detail-total-label">Стоимость</span>
        <span class="order-detail-total-price">${formatPrice(order.total)}</span>
      </div>
    </div>
    
    <div style="margin-top: 16px;">
      ${itemsHtml}
    </div>
  `;
  
  showPage("order-detail");
}