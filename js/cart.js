let cart = {};

function getCartItemsCount() {
  return Object.keys(cart).length;
}

function canAddToCart(productId) {
  if (productId <= 4) {
    if (cart[productId] >= 1) return { allowed: false, reason: "Максимум 1 шт." };
    if (productId <= 3) {
      const conflictIds = [1, 2, 3].filter(id => id !== productId && cart[id]);
      if (conflictIds.length > 0) {
        const conflictName = products.find(p => p.id === conflictIds[0]).name;
        return { allowed: false, reason: `Удалите товар "${conflictName}" из корзины, чтобы добавить этот товар` };
      }
    }
  }
  if (productId >= 5 && productId <= 26) {
    if ((cart[productId] || 0) >= 3) return { allowed: false, reason: "Максимум 3 шт." };
  }
  if (!cart[productId] && getCartItemsCount() >= 3) {
    return { allowed: false, reason: "Максимум 3 разных товара в корзине" };
  }
  return { allowed: true };
}

function renderCartButtonHtml(productId) {
  const qty = cart[productId] || 0;
  if (qty > 0) {
    return `<div class="card-action-btn counter-btn">
      <span class="counter-minus" data-id="${productId}"><img src="https://storage.botpapa.me/files/975c4510-49de-11f1-bef9-f1ec7a2c6e45.png" alt="-"></span>
      <span class="counter-value">${qty}</span>
      <span class="counter-plus" data-id="${productId}"><img src="https://storage.botpapa.me/files/9a5d01f0-49de-11f1-bef9-f1ec7a2c6e45.png" alt="+"></span>
    </div>`;
  }
  return `<div class="card-action-btn cart-add-btn" data-add="${productId}">В корзину</div>`;
}

function handleCartAction(pid, isIncrement) {
  if (isIncrement) {
    const check = canAddToCart(pid);
    if (!check.allowed) { alert(check.reason); return; }
    cart[pid] = (cart[pid] || 0) + 1;
  } else {
    if (cart[pid] === 1) delete cart[pid];
    else if (cart[pid] > 0) cart[pid]--;
  }
  if (document.getElementById("catalog-page").classList.contains("active-page")) {
    updateSingleCard(pid);
  }
  if (document.getElementById("cart-page").classList.contains("active-page")) {
    renderCartPage();
  } else if (document.getElementById("checkout-page").classList.contains("active-page")) {
    renderCheckoutForm();
  } else {
    document.getElementById("cartCheckoutFixed").style.display = "none";
  }
}

function changeQty(pid, delta) {
  hapticLight();
  if (delta === 1) {
    const check = canAddToCart(pid);
    if (!check.allowed) { alert(check.reason); return; }
    cart[pid] = (cart[pid] || 0) + 1;
  } else if (delta === -1) {
    const cur = cart[pid] || 0;
    if (cur === 1) delete cart[pid];
    else if (cur > 1) cart[pid] = cur - 1;
  }
  updateSingleCard(pid);
  renderCartPage();
}

function renderCartPage() {
  const container = document.getElementById("cartItemsList");
  if (!container) return;
  
  const items = Object.entries(cart);
  if (!items.length) { 
    container.innerHTML = `
      <div class="empty-state-icon">
        <img class="empty-icon" src="https://storage.botpapa.me/files/00feb9c0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="empty cart">
        <div class="empty-title">Корзина товаров пуста</div>
        <button class="empty-catalog-btn" id="emptyCartToCatalog">Перейти в каталог</button>
      </div>
    `;
    document.getElementById("cartCheckoutFixed").style.display = "none";
    isPromoMode = false;
    appliedPromo = null;
    setTimeout(() => {
      const btn = document.getElementById("emptyCartToCatalog");
      if(btn) btn.addEventListener("click", () => showPage("catalog"));
    }, 0);
    return; 
  }
  
  let html = '';
  for (let [id, qty] of items) {
    const prod = products.find(p => p.id == id);
    if (!prod) continue;
    
    html += `
      <div class="cart-item">
        <img class="cart-img" src="${prod.image}" alt="${escapeHtml(prod.name)}">
        <div class="cart-info">
          <div class="cart-product-name">${escapeHtml(prod.name)}</div>
          <div class="cart-product-price">${formatPrice(prod.price)}</div>
          <div class="cart-product-category">${escapeHtml(prod.category)}</div>
        </div>
        <div class="cart-actions">
          <div class="cart-quantity">
            <button class="cart-qty-btn" data-dec="${id}"><img src="https://storage.botpapa.me/files/975c4510-49de-11f1-bef9-f1ec7a2c6e45.png" alt="-"></button>
            <span class="cart-qty-value">${qty}</span>
            <button class="cart-qty-btn" data-inc="${id}"><img src="https://storage.botpapa.me/files/9a5d01f0-49de-11f1-bef9-f1ec7a2c6e45.png" alt="+"></button>
          </div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
  
  document.querySelectorAll("[data-dec]").forEach(btn => {
    btn.addEventListener("click", () => changeQty(parseInt(btn.dataset.dec), -1));
  });
  document.querySelectorAll("[data-inc]").forEach(btn => {
    btn.addEventListener("click", () => changeQty(parseInt(btn.dataset.inc), 1));
  });
  
  if (document.getElementById("cart-page").classList.contains("active-page")) {
    renderCheckoutBlock();
  }
}