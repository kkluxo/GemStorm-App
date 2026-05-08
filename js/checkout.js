let appliedPromo = null;
let isPromoMode = false;
let checkoutData = {
  paymentMethod: "",
  senderName: "",
  email: ""
};

async function sendOrderToServer(order) {
  try {
    const response = await fetch('https://gemstorm-app-production.up.railway.app/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return response.ok;
  } catch (error) {
    console.error('Ошибка:', error);
    return false;
  }
}

function renderCheckoutBlock() {
  const fixedBlock = document.getElementById("cartCheckoutFixed");
  const items = Object.entries(cart);
  const isCartPageActive = document.getElementById("cart-page").classList.contains("active-page");
  if (!items.length || !isCartPageActive) { if (fixedBlock) fixedBlock.style.display = "none"; return; }
  fixedBlock.style.display = "block";
  const rawTotal = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0);
  const discountedTotal = appliedPromo ? Math.round(rawTotal * (1 - appliedPromo.discountPercent / 100)) : rawTotal;
  
  if (isPromoMode) {
    fixedBlock.innerHTML = `<div class="checkout-card"><div class="total-row"><span class="promo-label">Введите промокод на скидку</span></div><div class="promo-input-row"><input type="text" class="promo-input" id="promoInput" placeholder="Введите промокод" value="${appliedPromo ? appliedPromo.code : ''}"><button class="promo-action-btn back-btn" id="promoBackBtn"><img src="https://storage.botpapa.me/files/af0747c0-4a13-11f1-bef9-f1ec7a2c6e45.png" alt="Назад"></button><button class="promo-action-btn apply-btn" id="promoApplyBtn"><img src="https://storage.botpapa.me/files/b254ec20-4a13-11f1-bef9-f1ec7a2c6e45.png" alt="Применить"></button></div></div>`;
    setTimeout(() => {
      const promoInput = document.getElementById("promoInput");
      const backBtn = document.getElementById("promoBackBtn");
      const applyBtn = document.getElementById("promoApplyBtn");
      backBtn?.addEventListener("click", () => { if (typeof hapticLight === 'function') hapticLight(); if (appliedPromo) appliedPromo = null; isPromoMode = false; renderCheckoutBlock(); renderCartPage(); });
      applyBtn?.addEventListener("click", () => { if (typeof hapticLight === 'function') hapticLight(); const code = promoInput?.value.trim().toUpperCase(); if (window.promoCodes && promoCodes[code]) { appliedPromo = { code, discountPercent: promoCodes[code] }; isPromoMode = false; renderCheckoutBlock(); renderCartPage(); } else if (promoInput) { promoInput.classList.add("error"); promoInput.value = "Промокод не найден"; setTimeout(() => { promoInput.classList.remove("error"); promoInput.value = appliedPromo ? appliedPromo.code : ""; }, 2000); } });
      promoInput?.addEventListener("keypress", (e) => { if (e.key === "Enter") applyBtn?.click(); });
    }, 0);
  } else {
    fixedBlock.innerHTML = `<div class="checkout-card"><div class="total-row"><span class="total-label">Общая стоимость:</span><span class="total-price-wrapper"><span class="total-price">${formatPrice(discountedTotal)}</span>${appliedPromo ? `<span class="total-old-price">${formatPrice(rawTotal)}</span>` : ''}</span></div><div class="checkout-buttons-row"><button class="checkout-button" id="checkoutBtn">Перейти к оформлению</button><button class="promo-btn" id="openPromoBtn"><img src="https://storage.botpapa.me/files/a488c6d0-4a12-11f1-bef9-f1ec7a2c6e45.png" alt="Промокод"></button></div></div>`;
    setTimeout(() => {
      document.getElementById("checkoutBtn")?.addEventListener("click", () => { if (typeof hapticMedium === 'function') hapticMedium(); showPage("checkout"); });
      document.getElementById("openPromoBtn")?.addEventListener("click", () => { if (typeof hapticLight === 'function') hapticLight(); isPromoMode = true; renderCheckoutBlock(); });
    }, 0);
  }
}

function renderCheckoutForm() {
  const container = document.getElementById("checkoutFormContent");
  const items = Object.entries(cart);
  if (!items.length) { container.innerHTML = '<div class="empty-state">Корзина пуста</div>'; return; }
  const rawTotal = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0);
  const discountedTotal = appliedPromo ? Math.round(rawTotal * (1 - appliedPromo.discountPercent / 100)) : rawTotal;
  
  container.innerHTML = `<div class="content-card"><div class="form-section"><div class="form-label">Почта от аккаунта</div><input type="email" class="form-input" id="emailInput" placeholder="Укажите почту аккаунта" value="${escapeHtml(checkoutData.email)}"></div><div class="form-section"><div class="form-label">Способ оплаты</div><select class="form-select-native" id="paymentMethodSelect"><option value="" disabled ${!checkoutData.paymentMethod ? 'selected' : ''}>Нажмите для выбора</option>${paymentMethodsOptions.map(o => `<option value="${o.value}" ${checkoutData.paymentMethod === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}</select></div><div class="form-section"><div class="form-label">Данные отправителя</div><input type="text" class="form-input" id="senderNameInput" placeholder="Укажите имя отправителя" value="${escapeHtml(checkoutData.senderName)}"></div></div>`;
  
  const fixedBlock = document.getElementById("cartCheckoutFixed");
  fixedBlock.style.display = "block";
  fixedBlock.innerHTML = `<div class="checkout-card"><div class="total-row"><span class="total-label">Общая стоимость:</span><span class="total-price-wrapper"><span class="total-price">${formatPrice(discountedTotal)}</span>${appliedPromo ? `<span class="total-old-price">${formatPrice(rawTotal)}</span>` : ''}</span></div><div class="checkout-buttons-row"><button class="checkout-button" id="payBtn">Перейти к оплате</button><button class="promo-btn" id="helpBtn"><img src="https://storage.botpapa.me/files/bc747470-4a25-11f1-bef9-f1ec7a2c6e45.png" alt="Помощь"></button></div></div>`;
  
  setTimeout(() => {
    const paymentSelect = document.getElementById("paymentMethodSelect");
    paymentSelect?.addEventListener("change", function() { checkoutData.paymentMethod = this.value; this.classList.remove("error"); });
    document.getElementById("helpBtn")?.addEventListener("click", () => { if (typeof hapticLight === 'function') hapticLight(); window.open("https://t.me/GemStormHelp", "_blank"); });
    document.getElementById("payBtn")?.addEventListener("click", () => { if (typeof hapticMedium === 'function') hapticMedium(); let hasError = false; const senderInput = document.getElementById("senderNameInput"); const emailInput = document.getElementById("emailInput"); if (!checkoutData.paymentMethod) { paymentSelect.classList.add("error"); hasError = true; } if (!senderInput.value.trim()) { senderInput.classList.add("error"); hasError = true; } else { senderInput.classList.remove("error"); checkoutData.senderName = senderInput.value.trim(); } if (!emailInput.value.trim()) { emailInput.classList.add("error"); hasError = true; } else { emailInput.classList.remove("error"); checkoutData.email = emailInput.value.trim(); } if (!hasError) showPage("payment"); });
    document.getElementById("senderNameInput")?.addEventListener("input", function() { checkoutData.senderName = this.value; this.classList.remove("error"); });
    document.getElementById("emailInput")?.addEventListener("input", function() { checkoutData.email = this.value; this.classList.remove("error"); });
  }, 0);
}

function renderPaymentPage() {
  const container = document.getElementById("paymentContent");
  const cardNum = getCardNumberFromValue(checkoutData.paymentMethod);
  const bank = getBankFromValue(checkoutData.paymentMethod);
  const items = Object.entries(cart);
  const rawTotal = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0);
  const discountedTotal = appliedPromo ? Math.round(rawTotal * (1 - appliedPromo.discountPercent / 100)) : rawTotal;
  
  container.innerHTML = `<div class="content-card"><div class="form-section"><div class="form-label">Номер карты</div><div class="form-select-readonly card-number-row"><span class="card-number-text">${cardNum}</span><img class="copy-icon" id="copyCardBtn" src="https://storage.botpapa.me/files/5d229210-4a28-11f1-bef9-f1ec7a2c6e45.png" alt="copy"></div></div><div class="form-section"><div class="form-label">Получатель</div><div class="form-select-readonly"><span>Азат Ф.</span></div></div><div class="form-section"><div class="form-label">Банк получателя</div><div class="form-select-readonly"><span>${bank}</span></div></div></div>`;
  
  const fixedBlock = document.getElementById("cartCheckoutFixed");
  fixedBlock.style.display = "block";
  fixedBlock.innerHTML = `<div class="checkout-card"><div class="total-row"><span class="total-label">Общая стоимость:</span><span class="total-price-wrapper"><span class="total-price">${formatPrice(discountedTotal)}</span>${appliedPromo ? `<span class="total-old-price">${formatPrice(rawTotal)}</span>` : ''}</span></div><div class="checkout-buttons-row"><button class="checkout-button" id="paidBtn">Я оплатил</button><button class="promo-btn" id="helpBtn2"><img src="https://storage.botpapa.me/files/bc747470-4a25-11f1-bef9-f1ec7a2c6e45.png" alt="Помощь"></button></div></div>`;
  
  setTimeout(() => {
    document.getElementById("copyCardBtn")?.addEventListener("click", () => { if (navigator.clipboard) navigator.clipboard.writeText(cardNum.replace(/\s/g, "")); if (typeof hapticLight === 'function') hapticLight(); });
    document.getElementById("helpBtn2")?.addEventListener("click", () => { if (typeof hapticLight === 'function') hapticLight(); window.open("https://t.me/GemStormHelp", "_blank"); });
    document.getElementById("paidBtn")?.addEventListener("click", async () => { if (typeof hapticMedium === 'function') hapticMedium();
      let tgUser = null; if (window.Telegram?.WebApp?.initDataUnsafe?.user) tgUser = window.Telegram.WebApp.initDataUnsafe.user;
      const items = Object.entries(cart); let total = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0); if (appliedPromo) total = Math.round(total * (1 - appliedPromo.discountPercent / 100));
      const order = { orderNumber: Date.now(), date: new Date().toLocaleDateString('ru-RU'), time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), timestamp: new Date().toISOString(), items: items.map(([id, qty]) => ({ id: parseInt(id), name: products.find(p => p.id == id).name, qty, price: products.find(p => p.id == id).price, image: products.find(p => p.id == id).image })), total: total, status: "Ожидание кода", status_code: "pending", promo: appliedPromo ? appliedPromo.code : null, promo_discount: appliedPromo ? appliedPromo.discountPercent : 0, payment_method: getPaymentMethodLabel(checkoutData.paymentMethod), sender_name: checkoutData.senderName, email: checkoutData.email, user_id: tgUser?.id, user_name: tgUser?.first_name, user_username: tgUser?.username };
      const success = await sendOrderToServer(order);
      if (success) { cart = {}; appliedPromo = null; isPromoMode = false; checkoutData = { paymentMethod: "", senderName: "", email: "" }; if (typeof updateAllCards === 'function') updateAllCards(); if (typeof renderCartPage === 'function') renderCartPage(); showPage("orders"); } else { if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert("❌ Ошибка при оформлении заказа"); else alert("❌ Ошибка при оформлении заказа"); }
    });
  }, 0);
}