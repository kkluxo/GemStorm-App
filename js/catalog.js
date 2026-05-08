let currentFilter = "Brawl Stars";
let searchQuery = "";

function renderCatalog() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;
  
  let filtered = products.filter(p => currentFilter === "Все категории" || p.category === currentFilter);
  if (searchQuery.trim()) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  if (!filtered.length) { 
    grid.innerHTML = `
      <div class="empty-state-icon">
        <img class="empty-icon" src="https://storage.botpapa.me/files/fa0bb410-4a0c-11f1-bef9-f1ec7a2c6e45.png" alt="empty catalog">
        <div class="empty-title">Товары не найдены</div>
        <button class="empty-catalog-btn" id="resetFiltersBtn">Сбросить фильтры</button>
      </div>
    `;
    setTimeout(() => {
      const resetBtn = document.getElementById("resetFiltersBtn");
      if(resetBtn) resetBtn.addEventListener("click", () => {
        searchQuery = "";
        document.getElementById("searchInput").value = "";
        currentFilter = "Brawl Stars";
        renderCatalog();
        renderFilterModal();
      });
    }, 0);
    return; 
  }
  
  grid.innerHTML = filtered.map(p => `
    <div class="product-card" data-id="${p.id}">
      <img class="card-img" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
      <div class="card-info">
        <div class="product-title">${escapeHtml(p.name)}</div>
        <div class="price-row"><span class="current-price">${formatPrice(p.price)}</span><span class="old-price">${formatPrice(p.oldPrice)}</span></div>
        ${renderCartButtonHtml(p.id)}
      </div>
    </div>
  `).join("");
  attachCardEvents();
}

function renderFilterModal() {
  const cats = ["Все категории", "Brawl Stars", "Clash Royale"];
  const container = document.getElementById("filterOptionsContainer");
  if (!container) return;
  container.innerHTML = cats.map(cat => `<div class="filter-row" data-filter="${cat}"><span class="filter-text">${cat}</span><span class="check-mark">${currentFilter === cat ? '✓' : ''}</span></div>`).join("");
  document.querySelectorAll(".filter-row").forEach(row => {
    row.addEventListener("click", () => { 
      hapticLight();
      currentFilter = row.dataset.filter; 
      renderFilterModal(); 
      renderCatalog(); 
      showPage("catalog"); 
    });
  });
}

function attachCardEvents() {
  document.querySelectorAll('.product-card').forEach(card => {
    const cardId = parseInt(card.dataset.id);
    const actionBtn = card.querySelector('.card-action-btn');
    if (!actionBtn) return;
    if (actionBtn.classList.contains('cart-add-btn')) {
      actionBtn.replaceWith(actionBtn.cloneNode(true));
      const newBtn = card.querySelector('.cart-add-btn');
      newBtn?.addEventListener('click', (e) => { e.stopPropagation(); handleCartAction(cardId, true); });
    } else if (actionBtn.classList.contains('counter-btn')) {
      const minus = actionBtn.querySelector('.counter-minus');
      const plus = actionBtn.querySelector('.counter-plus');
      minus?.replaceWith(minus.cloneNode(true));
      plus?.replaceWith(plus.cloneNode(true));
      const newMinus = actionBtn.querySelector('.counter-minus');
      const newPlus = actionBtn.querySelector('.counter-plus');
      newMinus?.addEventListener('click', (e) => { e.stopPropagation(); hapticLight(); handleCartAction(cardId, false); });
      newPlus?.addEventListener('click', (e) => {
        e.stopPropagation();
        hapticLight();
        if (cardId <= 4) {
          alert("Максимум 1 шт.");
          return;
        }
        handleCartAction(cardId, true);
      });
    }
  });
}

function updateAllCards() {
  document.querySelectorAll('.product-card').forEach(card => {
    const cardId = parseInt(card.dataset.id);
    const btnContainer = card.querySelector('.card-info > div:last-child');
    if (btnContainer) {
      btnContainer.outerHTML = renderCartButtonHtml(cardId);
    }
  });
  attachCardEvents();
}

function updateSingleCard(productId) {
  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (!card) return;
  const btnContainer = card.querySelector('.card-info > div:last-child');
  if (btnContainer) {
    btnContainer.outerHTML = renderCartButtonHtml(productId);
    attachCardEvents();
  }
}