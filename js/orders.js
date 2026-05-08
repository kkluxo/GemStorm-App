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
  container.innerHTML = orders.map(o => {
    let items = [];
    try { items = JSON.parse(o.items || '[]'); } catch(e) {}
    return `<div class="order-card" data-order-id="${o.id}"><div class="order-card-header"><span class="order-card-id">Заказ #${o.order_number}</span><span class="order-card-status">${o.status || 'В обработке'}</span></div><div class="order-card-date">${o.date} ${o.time || ''}</div><div class="order-card-products">${items.map(i => `<div style="display:flex;align-items:center;gap:8px;margin:5px 0"><img src="${i.image}" style="width:40px;height:40px;border-radius:8px;object-fit:cover">${i.name} ×${i.qty} — ${formatPrice(i.price * i.qty)}</div>`).join('')}${o.promo ? ` (промокод: ${o.promo})` : ''}</div><div class="order-card-total">${formatPrice(o.total)}</div>${o.verification_code ? `<div style="margin-top:8px;padding:8px;background:#1a1a1e;border-radius:10px;"><span style="color:#4ade80">🔑 Код: ${escapeHtml(o.verification_code)}</span></div>` : ''}</div>`;
  }).join('');
  container.querySelectorAll(".order-card").forEach(card => { card.addEventListener("click", () => { if (typeof hapticLight === 'function') hapticLight(); const order = orders.find(o => o.id == card.dataset.orderId); if (order) showOrderDetail(order); }); });
}

function showOrderDetail(order) {
  document.getElementById("orderDetailTitle").textContent = `Заказ #${order.order_number}`;
  const container = document.getElementById("orderDetailContent");
  let items = [];
  try { items = JSON.parse(order.items || '[]'); } catch(e) {}
  
  const itemsHtml = items.map(i => `<div class="order-detail-item"><div style="display:flex;align-items:center;gap:10px;"><img src="${i.image}" style="width:50px;height:50px;border-radius:10px;object-fit:cover"><div><div class="order-detail-item-name">${escapeHtml(i.name)}</div><div class="order-detail-item-price">${formatPrice(i.price)}</div></div></div><div class="order-detail-item-qty">${i.qty} шт.</div></div>`).join('');
  
  let codeBlock = '';
  if (order.status_code === 'pending' && !order.verification_code) {
    codeBlock = `<div style="margin-top:16px;background:#1a1a1e;border-radius:16px;padding:14px;"><div style="margin-bottom:10px;color:#fbbf24">📱 Введите код, который вам пришёл:</div><div style="display:flex;gap:10px;"><input type="text" id="verificationCodeInput" placeholder="Введите код" style="flex:1;background:#2a2a2e;border:1px solid #3a3a3e;border-radius:30px;padding:12px;color:white;font-size:14px;"><button id="submitCodeBtn" style="background:#4cb4e9;border:none;border-radius:30px;padding:0 20px;cursor:pointer;">✓</button></div></div>`;
  }
  
  container.innerHTML = `<div class="content-card"><div class="order-detail-row"><span class="order-detail-label">Статус</span><span class="order-detail-value" style="color:#4cb4e9">${order.status || 'В обработке'}</span></div><div class="order-detail-row"><span class="order-detail-label">Дата</span><span class="order-detail-value">${order.date} ${order.time || ''}</span></div><div class="order-detail-row"><span class="order-detail-label">Способ оплаты</span><span class="order-detail-value">${order.payment_method || '—'}</span></div><div class="order-detail-row"><span class="order-detail-label">Отправитель</span><span class="order-detail-value">${escapeHtml(order.sender_name || '—')}</span></div><div class="order-detail-row"><span class="order-detail-label">Почта</span><span class="order-detail-value">${escapeHtml(order.email || '—')}</span></div>${order.promo ? `<div class="order-detail-row"><span class="order-detail-label">Промокод</span><span class="order-detail-value">${order.promo} (−${order.promo_discount}%)</span></div>` : ''}${order.verification_code ? `<div class="order-detail-row"><span class="order-detail-label">Код</span><span class="order-detail-value" style="color:#4ade80">${escapeHtml(order.verification_code)}</span></div>` : ''}<div class="divider"></div><div class="order-detail-total-row"><span class="order-detail-total-label">Стоимость</span><span class="order-detail-total-price">${formatPrice(order.total)}</span></div></div><div style="margin-top:16px">${itemsHtml}</div>${codeBlock}`;
  
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