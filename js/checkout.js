let appliedPromo = null;
let isPromoMode = false;
let checkoutData = {
  paymentMethod: "",
  senderName: "",
  email: ""
};

// Функция отправки заказа админу через бота
async function sendOrderToAdmin(order) {
  try {
    // Формируем сообщение для админа
    let itemsList = order.items.map(item => 
      `└ ${item.name} x${item.qty} — ${formatPrice(item.price * item.qty)}`
    ).join('\n');
    
    let message = `🛒 *НОВЫЙ ЗАКАЗ #${order.id}*\n\n` +
      `👤 *Покупатель:* ${order.senderName || 'Не указан'}\n` +
      `📧 *Email:* ${order.email || 'Не указан'}\n` +
      `💳 *Оплата:* ${order.paymentMethod || 'Не указан'}\n` +
      `📦 *Товары:*\n${itemsList}\n\n` +
      `💰 *Итого:* ${formatPrice(order.total)}\n` +
      `🎫 *Промокод:* ${order.promo || 'Не использован'}\n\n` +
      `🕐 *Время:* ${order.date} ${order.time}`;
    
    // Отправляем через Telegram WebApp
    if (window.Telegram?.WebApp) {
      // Вариант 1: Через sendData (бот должен поддерживать)
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: 'new_order',
        order: order
      }));
      
      // Вариант 2: Через вызов API (если бот на том же домене)
      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, adminId: ADMIN_ID })
      });
      
      if (response.ok) {
        console.log('Заказ отправлен админу');
      }
    }
  } catch (error) {
    console.error('Ошибка отправки заказа админу:', error);
  }
}

// Функция сохранения заказа в localStorage для админ-панели
function saveOrderToAdminStorage(order) {
  try {
    let adminOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
    adminOrders.unshift(order);
    // Храним последние 100 заказов
    if (adminOrders.length > 100) adminOrders = adminOrders.slice(0, 100);
    localStorage.setItem('admin_orders', JSON.stringify(adminOrders));
    
    // Триггерим обновление админ-панели
    window.dispatchEvent(new CustomEvent('adminOrdersUpdated'));
  } catch (e) {
    console.error('Ошибка сохранения заказа:', e);
  }
}

function createOrder() {
  const items = Object.entries(cart);
  if (!items.length) return;
  
  let total = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0);
  if (appliedPromo) {
    total = Math.round(total * (1 - appliedPromo.discountPercent / 100));
  }
  
  let tgUser = null;
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    tgUser = window.Telegram.WebApp.initDataUnsafe.user;
  }
  
  const orderId = Date.now(); // Уникальный ID на основе времени
  const order = { 
    id: orderId, 
    orderNumber: orders.length + 1,
    date: new Date().toLocaleDateString('ru-RU'), 
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
    items: items.map(([id, qty]) => ({ 
      id: parseInt(id),
      name: products.find(p => p.id == id).name, 
      qty, 
      price: products.find(p => p.id == id).price,
      image: products.find(p => p.id == id).image,
      category: products.find(p => p.id == id).category
    })), 
    total, 
    status: "🟡 Ожидает проверки",
    statusCode: "pending",
    promo: appliedPromo ? appliedPromo.code : null,
    promoDiscount: appliedPromo ? appliedPromo.discountPercent : 0,
    paymentMethod: getPaymentMethodLabel(checkoutData.paymentMethod),
    senderName: checkoutData.senderName,
    email: checkoutData.email,
    user: tgUser ? {
      id: tgUser.id,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username
    } : null
  };
  
  // Сохраняем заказ в локальное хранилище пользователя
  orders.unshift(order);
  
  // Сохраняем заказ в админ-хранилище
  saveOrderToAdminStorage(order);
  
  // Отправляем заказ админу
  sendOrderToAdmin(order);
  
  // Очищаем корзину
  cart = {};
  appliedPromo = null;
  isPromoMode = false;
  checkoutData = { paymentMethod: "", senderName: "", email: "" };
  
  // Обновляем интерфейс
  updateAllCards();
  renderCartPage();
  renderOrdersPage();
  
  // Показываем уведомление об успешном заказе
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(`✅ Заказ #${order.orderNumber} оформлен!\n\nАдминистратор проверит оплату в ближайшее время.`);
  } else {
    alert(`✅ Заказ #${order.orderNumber} оформлен! Администратор свяжется с вами.`);
  }
  
  showOrderDetail(order.id);
}

// Остальной код checkout.js остаётся без изменений
function renderCheckoutBlock() {
  const fixedBlock = document.getElementById("cartCheckoutFixed");
  const items = Object.entries(cart);
  const isCartPageActive = document.getElementById("cart-page").classList.contains("active-page");
  
  if (!items.length || !isCartPageActive) {
    fixedBlock.style.display = "none";
    return;
  }
  
  fixedBlock.style.display = "block";
  
  const rawTotal = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0);
  const discountedTotal = appliedPromo ? Math.round(rawTotal * (1 - appliedPromo.discountPercent / 100)) : rawTotal;
  const hasDiscount = appliedPromo && discountedTotal < rawTotal;
  
  if (isPromoMode) {
    fixedBlock.innerHTML = `
      <div class="checkout-card">
        <div class="total-row">
          <span class="promo-label">Введите промокод на скидку</span>
        </div>
        <div class="promo-input-row">
          <input type="text" class="promo-input" id="promoInput" placeholder="Введите промокод" value="${appliedPromo ? appliedPromo.code : ''}">
          <button class="promo-action-btn back-btn" id="promoBackBtn">
            <img src="https://storage.botpapa.me/files/af0747c0-4a13-11f1-bef9-f1ec7a2c6e45.png" alt="Назад">
          </button>
          <button class="promo-action-btn apply-btn" id="promoApplyBtn">
            <img src="https://storage.botpapa.me/files/b254ec20-4a13-11f1-bef9-f1ec7a2c6e45.png" alt="Применить">
          </button>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      const promoInput = document.getElementById("promoInput");
      const backBtn = document.getElementById("promoBackBtn");
      const applyBtn = document.getElementById("promoApplyBtn");
      
      backBtn?.addEventListener("click", () => {
        hapticLight();
        if (appliedPromo) appliedPromo = null;
        isPromoMode = false;
        renderCheckoutBlock();
        renderCartPage();
      });
      
      applyBtn?.addEventListener("click", () => {
        hapticLight();
        const code = promoInput?.value.trim().toUpperCase();
        if (promoCodes[code]) {
          appliedPromo = { code, discountPercent: promoCodes[code] };
          isPromoMode = false;
          renderCheckoutBlock();
          renderCartPage();
        } else {
          if (promoInput) {
            promoInput.classList.add("error");
            promoInput.value = "Промокод не найден";
            setTimeout(() => {
              promoInput.classList.remove("error");
              promoInput.value = appliedPromo ? appliedPromo.code : "";
            }, 2000);
          }
        }
      });
      
      promoInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") applyBtn?.click();
      });
    }, 0);
  } else {
    let totalHtml = hasDiscount 
      ? `<span class="total-price-wrapper"><span class="total-price">${formatPrice(discountedTotal)}</span><span class="total-old-price">${formatPrice(rawTotal)}</span></span>`
      : `<span class="total-price-wrapper"><span class="total-price">${formatPrice(rawTotal)}</span></span>`;
    
    fixedBlock.innerHTML = `
      <div class="checkout-card">
        <div class="total-row">
          <span class="total-label">Общая стоимость:</span>
          ${totalHtml}
        </div>
        <div class="checkout-buttons-row">
          <button class="checkout-button" id="checkoutBtn">Перейти к оформлению</button>
          <button class="promo-btn" id="openPromoBtn">
            <img src="https://storage.botpapa.me/files/a488c6d0-4a12-11f1-bef9-f1ec7a2c6e45.png" alt="Промокод">
          </button>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      document.getElementById("checkoutBtn")?.addEventListener("click", () => {
        hapticMedium();
        showPage("checkout");
      });
      document.getElementById("openPromoBtn")?.addEventListener("click", () => {
        hapticLight();
        isPromoMode = true;
        renderCheckoutBlock();
      });
    }, 0);
  }
}

function renderCheckoutForm() {
  const container = document.getElementById("checkoutFormContent");
  const items = Object.entries(cart);
  
  if (!items.length) {
    container.innerHTML = '<div class="empty-state">Корзина пуста</div>';
    document.getElementById("cartCheckoutFixed").style.display = "none";
    return;
  }
  
  const rawTotal = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0);
  const discountedTotal = appliedPromo ? Math.round(rawTotal * (1 - appliedPromo.discountPercent / 100)) : rawTotal;
  const hasDiscount = appliedPromo && discountedTotal < rawTotal;
  
  let totalHtml = hasDiscount 
    ? `<span class="total-price-wrapper"><span class="total-price">${formatPrice(discountedTotal)}</span><span class="total-old-price">${formatPrice(rawTotal)}</span></span>`
    : `<span class="total-price-wrapper"><span class="total-price">${formatPrice(rawTotal)}</span></span>`;
  
  container.innerHTML = `
    <div class="content-card">
      <div class="form-section">
        <div class="form-label">Почта от аккаунта</div>
        <input type="email" class="form-input" id="emailInput" placeholder="Укажите почту аккаунта" value="${escapeHtml(checkoutData.email)}">
      </div>
      
      <div class="form-section">
        <div class="form-label">Способ оплаты</div>
        <select class="form-select-native" id="paymentMethodSelect">
          <option value="" disabled ${!checkoutData.paymentMethod ? 'selected' : ''}>Нажмите для выбора</option>
          ${paymentMethodsOptions.map(o => `<option value="${o.value}" ${checkoutData.paymentMethod === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-section">
        <div class="form-label">Данные отправителя</div>
        <input type="text" class="form-input" id="senderNameInput" placeholder="Укажите имя отправителя" value="${escapeHtml(checkoutData.senderName)}">
      </div>
    </div>
  `;
  
  const fixedBlock = document.getElementById("cartCheckoutFixed");
  fixedBlock.style.display = "block";
  fixedBlock.innerHTML = `
    <div class="checkout-card">
      <div class="total-row">
        <span class="total-label">Общая стоимость:</span>
        ${totalHtml}
      </div>
      <div class="checkout-buttons-row">
        <button class="checkout-button" id="payBtn">Перейти к оплате</button>
        <button class="promo-btn" id="helpBtn">
          <img src="https://storage.botpapa.me/files/bc747470-4a25-11f1-bef9-f1ec7a2c6e45.png" alt="Помощь">
        </button>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const paymentSelect = document.getElementById("paymentMethodSelect");
    paymentSelect?.addEventListener("change", function() {
      checkoutData.paymentMethod = this.value;
      this.classList.remove("error");
    });
    
    document.getElementById("helpBtn")?.addEventListener("click", () => {
      hapticLight();
      window.open("https://t.me/GemStormHelp", "_blank");
    });
    
    document.getElementById("payBtn")?.addEventListener("click", () => {
      hapticMedium();
      let hasError = false;
      const senderInput = document.getElementById("senderNameInput");
      const emailInput = document.getElementById("emailInput");
      
      if (!checkoutData.paymentMethod) {
        paymentSelect.classList.add("error");
        hasError = true;
      } else {
        paymentSelect.classList.remove("error");
      }
      
      if (!senderInput.value.trim()) {
        senderInput.classList.add("error");
        hasError = true;
      } else {
        senderInput.classList.remove("error");
        checkoutData.senderName = senderInput.value.trim();
      }
      
      if (!emailInput.value.trim()) {
        emailInput.classList.add("error");
        hasError = true;
      } else {
        emailInput.classList.remove("error");
        checkoutData.email = emailInput.value.trim();
      }
      
      if (!hasError) {
        showPage("payment");
      }
    });
    
    document.getElementById("senderNameInput")?.addEventListener("input", function() {
      checkoutData.senderName = this.value;
      this.classList.remove("error");
    });
    document.getElementById("emailInput")?.addEventListener("input", function() {
      checkoutData.email = this.value;
      this.classList.remove("error");
    });
  }, 0);
}

function renderPaymentPage() {
  const container = document.getElementById("paymentContent");
  const cardNum = getCardNumberFromValue(checkoutData.paymentMethod);
  const bank = getBankFromValue(checkoutData.paymentMethod);
  const items = Object.entries(cart);
  const rawTotal = items.reduce((s, [id, qty]) => s + (products.find(p => p.id == id).price * qty), 0);
  const discountedTotal = appliedPromo ? Math.round(rawTotal * (1 - appliedPromo.discountPercent / 100)) : rawTotal;
  const hasDiscount = appliedPromo && discountedTotal < rawTotal;
  
  let totalHtml = hasDiscount 
    ? `<span class="total-price-wrapper"><span class="total-price">${formatPrice(discountedTotal)}</span><span class="total-old-price">${formatPrice(rawTotal)}</span></span>`
    : `<span class="total-price-wrapper"><span class="total-price">${formatPrice(rawTotal)}</span></span>`;
  
  container.innerHTML = `
    <div class="content-card">
      <div class="form-section">
        <div class="form-label">Номер карты</div>
        <div class="form-select-readonly card-number-row">
          <span class="card-number-text">${cardNum}</span>
          <img class="copy-icon" id="copyCardBtn" src="https://storage.botpapa.me/files/5d229210-4a28-11f1-bef9-f1ec7a2c6e45.png" alt="copy">
        </div>
      </div>
      
      <div class="form-section">
        <div class="form-label">Получатель</div>
        <div class="form-select-readonly"><span>Азат Ф.</span></div>
      </div>
      
      <div class="form-section">
        <div class="form-label">Банк получателя</div>
        <div class="form-select-readonly"><span>${bank}</span></div>
      </div>
    </div>
  `;
  
  const fixedBlock = document.getElementById("cartCheckoutFixed");
  fixedBlock.style.display = "block";
  fixedBlock.innerHTML = `
    <div class="checkout-card">
      <div class="total-row">
        <span class="total-label">Общая стоимость:</span>
        ${totalHtml}
      </div>
      <div class="checkout-buttons-row">
        <button class="checkout-button" id="paidBtn">Я оплатил</button>
        <button class="promo-btn" id="helpBtn2">
          <img src="https://storage.botpapa.me/files/bc747470-4a25-11f1-bef9-f1ec7a2c6e45.png" alt="Помощь">
        </button>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    document.getElementById("copyCardBtn")?.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(cardNum.replace(/\s/g, ""));
      }
      hapticLight();
    });
    
    document.getElementById("helpBtn2")?.addEventListener("click", () => {
      hapticLight();
      window.open("https://t.me/GemStormHelp", "_blank");
    });
    
    document.getElementById("paidBtn")?.addEventListener("click", () => {
      hapticMedium();
      createOrder();
    });
  }, 0);
}