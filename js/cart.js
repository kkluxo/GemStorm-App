let cart = {};

function getCartItemsCount() {
  return Object.keys(cart).length;
}

function canAddToCart(productId) {
  // ... вся логика из твоего кода
}

function renderCartButtonHtml(productId) {
  const qty = cart[productId] || 0;
  if (qty > 0) {
    return `<div class="card-action-btn counter-btn">...</div>`;
  }
  return `<div class="card-action-btn cart-add-btn" data-add="${productId}">В корзину</div>`;
}

function handleCartAction(pid, isIncrement) {
  // ... логика
}

function changeQty(pid, delta) {
  // ... логика
}

function renderCartPage() {
  // ... рендер страницы корзины
}

function renderCheckoutBlock() {
  // ... блок с общей стоимостью
}