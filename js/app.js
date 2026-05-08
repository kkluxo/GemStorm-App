function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  const targetPage = document.getElementById(pageId + "-page");
  if (targetPage) targetPage.classList.add("active-page");
  
  const checkoutBlock = document.getElementById("cartCheckoutFixed");
  
  if (pageId === "catalog") {
    renderCatalog();
    checkoutBlock.style.display = "none";
  }
  if (pageId === "cart") {
    renderCartPage();
  }
  if (pageId === "orders") {
    renderOrdersPage();
    checkoutBlock.style.display = "none";
  }
  if (pageId === "profile") {
    renderProfilePage();
    checkoutBlock.style.display = "none";
  }
  if (pageId === "checkout") {
    renderCheckoutForm();
  }
  if (pageId === "payment") {
    renderPaymentPage();
  }
  if (pageId === "order-detail") {
    checkoutBlock.style.display = "none";
  }
  if (pageId === "filter") {
    checkoutBlock.style.display = "none";
  }
  
  // Активное состояние меню
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
    if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
    try {
      tg.setHeaderColor('#171719');
      tg.setBackgroundColor('#171719');
    } catch(e) {}
    document.body.style.backgroundColor = '#171719';
  }
})();

// Скрываем клавиатуру при клике вне полей ввода
document.addEventListener('click', function(e) {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      document.activeElement.blur();
    }
  }
});

// События
document.getElementById("openFilterBtn")?.addEventListener("click", () => { 
  hapticLight();
  renderFilterModal(); 
  showPage("filter"); 
});

document.getElementById("searchInput")?.addEventListener("input", (e) => { 
  searchQuery = e.target.value; 
  renderCatalog(); 
});

document.querySelectorAll(".menu-item").forEach(btn => {
  btn.addEventListener("click", () => {
    hapticLight();
    showPage(btn.dataset.page);
  });
});

// Запуск приложения
document.querySelector('.menu-item[data-page="catalog"]')?.classList.add("active");
renderCatalog();
renderCartPage();
renderOrdersPage();
renderFilterModal();
renderProfilePage();
document.getElementById("cartCheckoutFixed").style.display = "none";

// Запуск админ-панели (только для админа)
if (typeof initAdmin === 'function') {
  initAdmin();
}