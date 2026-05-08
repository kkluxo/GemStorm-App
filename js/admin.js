const ADMIN_ID = 7509324385;

function isAdmin() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  return user ? user.id == ADMIN_ID : false;
}

function initAdmin() {
  if (!isAdmin()) return;
  
  // Добавляем кнопку "Админ панель" в меню
  const bottomMenu = document.querySelector('.bottom-menu');
  if (!bottomMenu || document.querySelector('.menu-item[data-page="admin"]')) return;
  
  const btn = document.createElement('button');
  btn.className = 'menu-item';
  btn.setAttribute('data-page', 'admin');
  btn.innerHTML = `
    <span class="menu-label">👑 Админ</span>
  `;
  btn.addEventListener('click', () => {
    window.open('admin-panel.html', '_blank');
  });
  bottomMenu.appendChild(btn);
}

// Запускаем после загрузки
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}