function renderProfilePage() {
  const container = document.getElementById("profileContent");
  if (!container) return;
  
  let tgUser = null;
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    tgUser = window.Telegram.WebApp.initDataUnsafe.user;
  }
  
  const nickname = tgUser?.first_name || "Пользователь";
  const username = tgUser?.username ? "@" + tgUser.username : "@username";
  const photoUrl = tgUser?.photo_url || "";
  const userId = tgUser?.id || "0";
  const refLink = `https://t.me/GeltanStoreBot?start=ref${userId}`;
  
  container.innerHTML = `
    <div class="profile-card">
      ${photoUrl ? `<img class="profile-avatar" src="${photoUrl}" alt="avatar">` : '<div class="profile-avatar" style="background:#303032;display:flex;align-items:center;justify-content:center;font-size:24px;color:#9e9e9e;">👤</div>'}
      <div class="profile-info">
        <div class="profile-nickname">${escapeHtml(nickname)}</div>
        <div class="profile-username">${escapeHtml(username)}</div>
      </div>
    </div>
    
    <div class="subscribe-card" id="subscribeChannelBtn">
      <div class="subscribe-info">
        <div class="subscribe-title">Подпишитесь на наш канал</div>
        <div class="subscribe-text">Следите за новостями и акциями</div>
      </div>
      <svg class="telegram-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.6-1.38-.97-2.23-1.56-.99-.67-.35-1.04.22-1.64.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.09-.06-.13-.07-.04-.16-.02-.23-.01-.1.02-1.7 1.08-4.8 3.17-.45.31-.86.46-1.23.45-.4-.01-1.18-.23-1.76-.42-.7-.23-1.26-.35-1.21-.74.03-.2.3-.41.83-.63 3.27-1.42 5.45-2.36 6.54-2.82 3.11-1.31 3.76-1.53 4.18-1.54.09 0 .3.02.43.12.11.09.14.2.16.32.02.12 0 .25-.02.38z" fill="#4cb4e9"/>
      </svg>
    </div>
    
    <div class="referral-card">
      <div class="referral-title">Реферальная программа</div>
      <div class="referral-subtitle">Приглашайте друзей и получайте бонусы</div>
      
      <div class="referral-stats">
        <div class="referral-stat">
          <div class="referral-stat-value">0</div>
          <div class="referral-stat-label">Приглашено</div>
        </div>
        <div class="referral-stat">
          <div class="referral-stat-value">0 ₽</div>
          <div class="referral-stat-label">Заработано</div>
        </div>
      </div>
      
      <div class="referral-link-row">
        <input type="text" class="referral-link-input" id="refLinkInput" value="${refLink}" readonly>
        <button class="referral-copy-circle" id="refCopyBtn">
          <img src="https://storage.botpapa.me/files/5d229210-4a28-11f1-bef9-f1ec7a2c6e45.png" alt="copy">
        </button>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    document.getElementById("refCopyBtn")?.addEventListener("click", () => {
      const refInput = document.getElementById("refLinkInput");
      if (refInput && navigator.clipboard) {
        navigator.clipboard.writeText(refInput.value);
      }
      hapticLight();
    });
    document.getElementById("subscribeChannelBtn")?.addEventListener("click", () => {
      hapticLight();
      window.open("https://t.me/GemStormStore", "_blank");
    });
  }, 0);
}