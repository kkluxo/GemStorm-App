const ADMIN_ID = 7509324385;

function isAdmin() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!user) return false;
  return user.id == ADMIN_ID;
}

// Функция показа страниц для пользователя
function showUserPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  const target = document.getElementById(pageId + "-page");
  if (target) target.classList.add("active-page");
  
  if (pageId === "catalog" && typeof renderCatalog === 'function') renderCatalog();
  if (pageId === "cart" && typeof renderCartPage === 'function') renderCartPage();
  if (pageId === "orders" && typeof renderOrdersPage === 'function') renderOrdersPage();
  if (pageId === "profile" && typeof renderProfilePage === 'function') renderProfilePage();
  if (pageId === "filter" && typeof renderFilterModal === 'function') renderFilterModal();
  if (pageId === "checkout" && typeof renderCheckoutForm === 'function') renderCheckoutForm();
  if (pageId === "payment" && typeof renderPaymentPage === 'function') renderPaymentPage();
  
  document.querySelectorAll(".menu-item").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.menu-item[data-page="${pageId}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

// Запуск приложения
window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM загружен');
  
  // Настройка Telegram
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor('#171719');
      tg.setBackgroundColor('#171719');
    } catch(e) {}
  }
  
  // Проверяем админ ли пользователь
  if (isAdmin()) {
    console.log('👑 Админ режим');
    // Скрываем пользовательский интерфейс
    document.querySelector('.user-only').style.display = 'none';
    // Показываем админ-панель
    document.getElementById('adminPanel').style.display = 'block';
    // Запускаем админ-панель
    if (typeof initAdminPanel === 'function') {
      initAdminPanel();
    } else {
      console.error('initAdminPanel не найдена!');
    }
  } else {
    console.log('👤 Пользовательский режим');
    // Показываем пользовательский интерфейс
    document.querySelector('.user-only').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    
    // Ждём немного для загрузки всех скриптов
    setTimeout(function() {
      if (typeof renderCatalog === 'function') renderCatalog();
      if (typeof renderCartPage === 'function') renderCartPage();
      if (typeof renderOrdersPage === 'function') renderOrdersPage();
      if (typeof renderFilterModal === 'function') renderFilterModal();
      if (typeof renderProfilePage === 'function') renderProfilePage();
      
      // Показываем каталог по умолчанию
      showUserPage('catalog');
    }, 100);
  }
  
  // Навешиваем обработчики на меню
  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', function() {
      if (typeof hapticLight === 'function') hapticLight();
      const page = this.dataset.page;
      if (page && !isAdmin()) {
        showUserPage(page);
      }
    });
  });
  
  // Обработчики для поиска и фильтра
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      if (typeof searchQuery !== 'undefined') {
        window.searchQuery = e.target.value;
        if (typeof renderCatalog === 'function') renderCatalog();
      }
    });
  }
  
  const filterBtn = document.getElementById('openFilterBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', function() {
      if (typeof hapticLight === 'function') hapticLight();
      if (typeof renderFilterModal === 'function') renderFilterModal();
      showUserPage('filter');
    });
  }
});