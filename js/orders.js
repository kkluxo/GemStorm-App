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
  container.innerHTML = `<div style="text-align:center;padding:40px 0;color:#9e9e9e"><div style="width:28px;height:28px;border:2px solid #2a2a2e;border-top-color:#4cb4e9;border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 12px"></div>Загрузка...</div>`;
  loadUserOrders().then(() => displayOrders(container));
}

function displayOrders(container) {
  if (!orders.length) {
    container.innerHTML = `<div class="empty-state-icon"><img class="empty-icon" src="https://storage.botpapa.me/files/8a684130-49e6-11f1-bef9-f1ec7a2c6e45.png" alt=""><div class="empty-title">Заказов еще нет</div><button class="empty-catalog-btn" id="emptyOrdersToCatalog">Перейти в каталог</button></div>`;
    setTimeout(() => { document.getElementById("emptyOrdersToCatalog")?.addEventListener("click", () => showPage("catalog")); }, 0);
    return;
  }
  container.innerHTML = orders.map((o, index) => {
    let items = [];
    try { items = JSON.parse(o.items || '[]'); } catch(e) {}
    return `<div class="order-card" data-order-id="${o.id}">
      <div class="order-card-header">
        <span class="order-card-id">Заказ ${index + 1}</span>
        <span class="order-card-status">${(o.status || 'Ожидание кода').replace(/[🟡✅❌🔵⚙⏳]/g, '').trim()}</span>
      </div>
      <div class="order-card-date">${o.date} ${o.time || ''}</div>
      <div class="order-card-products">${items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>
      <div class="order-card-total">${formatPrice(o.total)}</div>
      ${o.verification_code ? `<div style="margin-top:8px;padding:8px;background:#1a1a1e;border-radius:10px;"><span style="color:#4ade80">Код: ${escapeHtml(o.verification_code)}</span></div>` : ''}
    </div>`;
  }).join('');
  container.querySelectorAll(".order-card").forEach(card => { card.addEventListener("click", () => { if (typeof hapticLight === 'function') hapticLight(); const order = orders.find(o => o.id == card.dataset.orderId); if (order) showOrderDetail(order); }); });
}

function showOrderDetail(order) {
  document.getElementById("orderDetailTitle").textContent = `Заказ ${getOrderIndex(order.id)}`;
  const container = document.getElementById("orderDetailContent");
  let items = [];
  try { items = JSON.parse(order.items || '[]'); } catch(e) {}
  
  const itemsHtml = items.map(i => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #2a2a2e;"><span>${escapeHtml(i.name)} x${i.qty}</span><span style="color:#4cb4e9">${formatPrice(i.price * i.qty)}</span></div>`).join('');
  
  let codeBlock = '';
  const isPending = order.status_code === 'pending';
  const hasNoCode = !order.verification_code;
  
  if (isPending && hasNoCode) {
    codeBlock = `
      <div style="position:fixed;bottom:70px;left:0;right:0;background:#18181b;border-top:1px solid #2a2a2e;padding:12px 16px;z-index:100;">
        <div style="background:#222226;border:1px solid #2a2a2e;border-radius:20px;padding:14px;">
          <div style="margin-bottom:10px;color:#fbbf24">Введите код который вам пришел</div>
          <div style="display:flex;gap:10px;">
            <input type="text" id="verificationCodeInput" placeholder="Введите код" style="flex:1;background:#2a2a2e;border:1px solid #3a3a3e;border-radius:30px;padding:12px;color:white;font-size:14px;">
            <button id="submitCodeBtn" style="background:#4cb4e9;border:none;border-radius:30px;padding:0 20px;cursor:pointer;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
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
      ${order.verification_code ? `<div class="order-detail-row"><span class="order-detail-label">Код</span><span class="order-detail-value" style="color:#4ade80">${escapeHtml(order.verification_code)}</span></div>` : ''}
    </div>
    <div style="margin-top:16px;background:#18181b;border-radius:20px;padding:16px;">
      <div style="font-weight:600;margin-bottom:12px;">Товары</div>
      ${itemsHtml}
      <div style="display:flex;justify-content:space-between;padding:12px 0 0 0;margin-top:8px;border-top:1px solid #2a2a2e;font-weight:700;">
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

function getOrderIndex(orderId) {
  const index = orders.findIndex(o => o.id === orderId);
  return index !== -1 ? index + 1 : '?';
}