// ID админа (твой Telegram ID)
const ADMIN_ID = 7509324385;

// Проверка, является ли пользователь админом
function isAdmin() {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    return user.id == ADMIN_ID;
  }
  return false;
}

// Добавление кнопки для админа (ведёт на отдельную страницу)
function addAdminButton() {
  if (!isAdmin()) return;
  
  const bottomMenu = document.querySelector('.bottom-menu');
  if (!bottomMenu) return;
  
  if (document.querySelector('.menu-item[data-page="admin"]')) return;
  
  const adminMenuItem = document.createElement('button');
  adminMenuItem.className = 'menu-item';
  adminMenuItem.setAttribute('data-page', 'admin');
  adminMenuItem.innerHTML = `
    <img class="menu-icon menu-icon-inactive" src="https://storage.botpapa.me/files/1656bed0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width: 28px; height: 28px;">
    <img class="menu-icon menu-icon-active" src="https://storage.botpapa.me/files/12337af0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width: 28px; height: 28px;">
    <span class="menu-label">Админ</span>
  `;
  bottomMenu.appendChild(adminMenuItem);
  
  adminMenuItem.addEventListener('click', () => {
    hapticLight();
    // Открываем отдельную админ-страницу в новом окне
    window.open('admin-panel.html', '_blank');
  });
}

// Инициализация
function initAdmin() {
  addAdminButton();
}

// Запускаем инициализацию
initAdmin();