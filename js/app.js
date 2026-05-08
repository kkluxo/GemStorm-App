function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  const targetPage = document.getElementById(pageId + "-page");
  if (targetPage) targetPage.classList.add("active-page");
  
  const checkoutBlock = document.getElementById("cartCheckoutFixed");
  
  if (pageId === "catalog") {
    renderCatalog();
    if (checkoutBlock) checkoutBlock.style.display = "none";
  }
  if (pageId === "cart") {
    renderCartPage();
  }
  if (pageId === "orders") {
    renderOrdersPage();
    if (checkoutBlock) checkoutBlock.style.display = "none";
  }
  if (pageId === "profile") {
    renderProfilePage();
    if (checkoutBlock) checkoutBlock.style.display = "none";
  }
  if (pageId === "checkout") {
    renderCheckoutForm();
  }
  if (pageId === "payment") {
    renderPaymentPage();
  }
  if (pageId === "filter") {
    if (checkoutBlock) checkoutBlock.style.display = "none";
  }
  
  document.querySelectorAll(".menu-item").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.menu-item[data-page="${pageId}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  
  window.scrollTo({ top: 0 });
}

// Инициализация Telegram
(function() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor('#171719');
      tg.setBackgroundColor('#171719');
    } catch(e) {}
  }
})();

// Скрываем клавиатуру
document.addEventListener('click', function(e) {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      document.activeElement.blur();
    }
  }
});

// События
const openFilterBtn = document.getElementById("openFilterBtn");
if (openFilterBtn) {
  openFilterBtn.addEventListener("click", () => { 
    if (typeof hapticLight === 'function') hapticLight();
    if (typeof renderFilterModal === 'function') renderFilterModal(); 
    showPage("filter"); 
  });
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", (e) => { 
    if (typeof searchQuery !== 'undefined') {
      window.searchQuery = e.target.value; 
      renderCatalog();
    }
  });
}

document.querySelectorAll(".menu-item").forEach(btn => {
  btn.addEventListener("click", () => {
    if (typeof hapticLight === 'function') hapticLight();
    showPage(btn.dataset.page);
  });
});

// Запуск
if (typeof renderCatalog === 'function') renderCatalog();
if (typeof renderCartPage === 'function') renderCartPage();
if (typeof renderOrdersPage === 'function') renderOrdersPage();
if (typeof renderFilterModal === 'function') renderFilterModal();
if (typeof renderProfilePage === 'function') renderProfilePage();

const checkoutBlock = document.getElementById("cartCheckoutFixed");
if (checkoutBlock) checkoutBlock.style.display = "none";

// Активируем каталог
const catalogBtn = document.querySelector('.menu-item[data-page="catalog"]');
if (catalogBtn) catalogBtn.classList.add("active");