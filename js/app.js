function showPage(pageId) { ... }

// Инициализация Telegram
(function() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    // ...
  }
})();

// События
document.getElementById("openFilterBtn")?.addEventListener("click", ...);
document.getElementById("searchInput")?.addEventListener("input", ...);
document.querySelectorAll(".menu-item").forEach(btn => ...);

// Запуск
renderCatalog();
renderCartPage();
renderOrdersPage();
renderFilterModal();
renderProfilePage();