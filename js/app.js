const ADMIN_ID = 7509324385;

function isAdmin() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  return user ? user.id == ADMIN_ID : false;
}

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
  if (pageId === "order-detail") {
    if (checkoutBlock) checkoutBlock.style.display = "none";
  }
  if (pageId === "filter") {
    if (checkoutBlock) checkoutBlock.style.display = "none";
  }
  
  // Активное состояние меню
  document.querySelectorAll(".menu-item").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.menu-item[data-page="${pageId}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Инициализация Telegram и приложения
(function initApp() {
  // Настройка Telegram WebApp
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
  
  // Определяем, админ ли пользователь
  if (isAdmin()) {
    // Режим админа: показываем админ-панель, скрываем всё пользовательское
    document.body.classList.add('admin-mode');
    const userOnly = document.querySelector('.user-only');
    const adminPanel = document.getElementById('adminPanel');
    if (userOnly) userOnly.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    // Запускаем админ-панель
    if (typeof initAdminPanel === 'function') {
      initAdminPanel();
    }
  } else {
    // Режим пользователя: показываем магазин
    document.body.classList.remove('admin-mode');
    const userOnly = document.querySelector('.user-only');
    const adminPanel = document.getElementById('adminPanel');
    if (userOnly) userOnly.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Инициализация пользовательского интерфейса
    if (typeof renderCatalog === 'function') {
      renderCatalog();
    }
    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }
    if (typeof renderOrdersPage === 'function') {
      renderOrdersPage();
    }
    if (typeof renderFilterModal === 'function') {
      renderFilterModal();
    }
    if (typeof renderProfilePage === 'function') {
      renderProfilePage();
    }
    
    // Скрываем панель оформления
    const checkoutBlock = document.getElementById("cartCheckoutFixed");
    if (checkoutBlock) checkoutBlock.style.display = "none";
    
    // Активируем первый пункт меню (каталог)
    const catalogMenuItem = document.querySelector('.menu-item[data-page="catalog"]');
    if (catalogMenuItem) catalogMenuItem.classList.add("active");
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

// События для обычных пользователей (только если они есть на странице)
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
    }
    if (typeof renderCatalog === 'function') renderCatalog(); 
  });
}

const menuItems = document.querySelectorAll(".menu-item");
menuItems.forEach(btn => {
  btn.addEventListener("click", () => {
    if (typeof hapticLight === 'function') hapticLight();
    showPage(btn.dataset.page);
  });
});