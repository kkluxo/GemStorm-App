let orders = [];

async function loadUserOrders() {
  try {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser?.id) return;
    const r = await fetch(`https://gemstorm-app-production.up.railway.app/api/user-orders?userId=${tgUser.id}`);
    if (r.ok) orders = await r.json();
  } catch(e) { console.error('Ошибка загрузки заказов:', e); }
}

function renderOrdersPage() {
  const container = document.getElementById("ordersList");
  if (!container) return;
  
  loadUserOrders().then(() => {
    if (!orders.length) {
      container.innerHTML = `<div class="empty-state-icon"><img class="empty-icon" src="https://storage.botpapa.me/files/8a684130-49e6-11f1-bef9-f1ec7a2c6e45.png" alt=""><div class="empty-title">Заказов еще нет</div><button class="empty-catalog-btn" id="emptyOrdersToCatalog">Перейти в каталог</button></div>`;
      setTimeout(() => { document.getElementById("emptyOrdersToCatalog")?.addEventListener("click", () => showPage("catalog")); }, 0);
      return;
    }
    
    container.innerHTML = orders.map((o) => {
      let items = [];
      try { items = JSON.parse(o.items || '[]'); } catch(e) {}
      let statusText = (o.status || 'Ожидание кода').replace(/[🟡✅❌🔵⚙⏳]/g, '').trim();
      return `
        <div class="order-card" data-order-id="${o.id}">
          <div class="order-card-header">
            <span class="order-card-id">Заказ ${o.order_number}</span>
            <span class="order-card-status">${statusText}</span>
            <button class="order-refresh-btn" data-id="${o.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
          <div class="order-card-date">${o.date} ${o.time || ''}</div>
          <div class="order-card-products">${items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>
          <div class="order-card-total">${formatPrice(o.total)}</div>
        </div>
      `;
    }).join('');
    
    container.querySelectorAll(".order-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest('.order-refresh-btn')) return;
        const order = orders.find(o => o.id == card.dataset.orderId);
        if (order) showOrderDetail(order);
      });
    });
    
    container.querySelectorAll(".order-refresh-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const orderId = btn.dataset.id;
        await refreshOrderStatus(orderId);
      });
    });
  });
}

async function refreshOrderStatus(orderId) {
  try {
    const response = await fetch('https://gemstorm-app-production.up.railway.app/api/refresh-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    if (response.ok) {
      const updatedOrder = await response.json();
      const index = orders.findIndex(o => o.id == orderId);
      if (index !== -1) orders[index] = updatedOrder;
      renderOrdersPage();
      if (typeof hapticLight === 'function') hapticLight();
    }
  } catch(e) { console.error(e); }
}

function showOrderDetail(order) {
  document.getElementById("orderDetailTitle").textContent = `Заказ ${order.order_number}`;
  const container = document.getElementById("orderDetailContent");
  let items = [];
  try { items = JSON.parse(order.items || '[]'); } catch(e) {}
  
  const itemsHtml = items.map(i => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;">
      <span>${escapeHtml(i.name)} x${i.qty}</span>
      <span style="color:#4cb4e9">${formatPrice(i.price * i.qty)}</span>
    </div>
  `).join('');
  
  let codeBlock = '';
  const isPending = order.status_code === 'pending';
  const hasNoCode = !order.verification_code;
  
  if (isPending && hasNoCode) {
    codeBlock = `
      <div class="checkout-card" style="position:fixed;bottom:70px;left:0;right:0;margin:0 16px 12px 16px;width:auto;z-index:100;">
        <div style="margin-bottom:10px;">Введите код который вам пришел</div>
        <div style="display:flex;gap:10px;">
          <input type="text" id="verificationCodeInput" placeholder="Введите код" style="flex:1;background:#2a2a2e;border:1px solid #3a3a3e;border-radius:30px;padding:12px;color:white;font-size:14px;">
          <button id="submitCodeBtn" style="background:#4cb4e9;border:none;border-radius:50px;width:48px;height:48px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = `
    <div class="content-card">
      <div class="order-detail-row"><span class="order-detail-label">Статус</span><span class="order-detail-value" style="color:#4cb4e9">${(order.status || 'Ожидание кода').replace(/[🟡✅❌🔵⚙⏳]/g, '').trim()}</span></div>
      <div class="order-detail-row"><span class="order-detail-label">Дата</span><span class="order-detail-value">${order.date} ${order.time || ''}</span></div>
      <div class="order-detail-row"><span class="order-detail-label">Способ оплаты</span><span class="order-detail-value">${order.payment_method || '—'}</span></div>
      <div class="order-detail-row"><span class="order-detail-label">Отправитель</span><span class="order-detail-value">${escapeHtml(order.sender_name || '—')}</span></div>
      <div class="order-detail-row"><span class="order-detail-label">Почта</span><span class="order-detail-value">${escapeHtml(order.email || '—')}</span></div>
      ${order.promo ? `<div class="order-detail-row"><span class="order-detail-label">Промокод</span><span class="order-detail-value">${order.promo} (скидка ${order.promo_discount}%)</span></div>` : ''}
    </div>
    
    <div style="margin-top:16px;background:#222226;border:1px solid #2a2a2e;border-radius:16px;padding:12px;">
      ${itemsHtml}
      <div style="display:flex;justify-content:space-between;padding:10px 0 0 0;margin-top:8px;font-weight:700;">
        <span>Стоимость</span>
        <span style="color:#4cb4e9">${formatPrice(order.total)}</span>
      </div>
    </div>
    ${codeBlock}
  `;
  
  showPage("order-detail");
  
  setTimeout(() => {
    const submitBtn = document.getElementById("submitCodeBtn");
    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        const codeInput = document.getElementById("verificationCodeInput");
        const code = codeInput?.value.trim();
        if (!code) { alert("Введите код"); return; }
        try {
          const response = await fetch('https://gemstorm-app-production.up.railway.app/api/submit-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id, code: code })
          });
          if (response.ok) {
            alert("Код отправлен администратору");
            showPage("orders");
          } else alert("Ошибка отправки кода");
        } catch(e) { alert("Ошибка соединения"); }
      });
    }
  }, 100);
}