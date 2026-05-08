const ADMIN_ID = 7509324385;

function isAdmin() {
const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
return user ? user.id == ADMIN_ID : false;
}

function initAdmin() {
if (!isAdmin()) return;

const bottomMenu = document.querySelector(’.bottom-menu’);
if (!bottomMenu || document.querySelector(’.menu-item[data-page=“admin”]’)) return;

const btn = document.createElement(‘button’);
btn.className = ‘menu-item’;
btn.setAttribute(‘data-page’, ‘admin’);
btn.innerHTML = `<img class="menu-icon menu-icon-inactive" src="https://storage.botpapa.me/files/1656bed0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width:28px;height:28px"> <img class="menu-icon menu-icon-active"   src="https://storage.botpapa.me/files/12337af0-4a0d-11f1-bef9-f1ec7a2c6e45.png" alt="admin" style="width:28px;height:28px"> <span class="menu-label">Админ</span>`;
btn.addEventListener(‘click’, () => {
hapticLight();
window.open(‘admin-panel.html’, ‘_blank’);
});
bottomMenu.appendChild(btn);
}