const PRICE_TABLE = {
  0.99:  [85, 89]; 1.99:  [169, 179]; 2.99:  [249, 269]; 3.99:  [339, 359]; 4.99:  [429, 449]; 5.99:  [509, 529]; 6.99:  [589, 619]; 7.99:  [679, 709]; 8.99:  [769, 799]; 9.99:  [849, 889]; 10.99: [939, 979]; 11.99: [1019, 1069]; 12.99: [1099, 1159]; 13.99: [1189, 1249]; 14.99: [1269, 1339];
  15.99: [1359, 1419]; 16.99: [1439, 1509]; 17.99: [1529, 1599]; 18.99: [1619, 1689]; 19.99: [1699, 1779]; 24.99: [2129, 2229]
};

function getRubPrices(usdPrice) {
  const rubPrices = PRICE_TABLE[usdPrice];
  if (!rubPrices) return { price: 0, oldPrice: 0 };
  return { price: rubPrices[0], oldPrice: rubPrices[1] };
}

function getUsdFromRub(rubPrice) {
  for (const [usd, rub] of Object.entries(PRICE_TABLE)) {
    if (rub[1] === rubPrice) return parseFloat(usd);
  }
  return null;
}

const products = [
  // Пропуски
  { id: 1, name: "Brawl Pass", usdPrice: 8.99, label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [1, 2, 3], visible: true, image: "https://storage.botpapa.me/files/6b57bf60-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 2, name: "Brawl Pass Plus", usdPrice: 12.99, label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [1, 2, 3], visible: true, image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 3, name: "Улучш. до BP+", usdPrice: 4.99, label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [1, 2, 3], visible: true, image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 4, name: "Pro Pass", usdPrice: 24.99, label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/72f535e0-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Боец Болт
  { id: 47, name: "Боец Болт", usdPrice: 8.99, label: "Боец Болт", category: "Боец Болт", maxQty: 1, conflictGroup: [], visible: true, image: "https://store.supercell.com/assets/offer-images/brawlstars/ab15739c18373b4c23c775819fc499026cc0a0f6abbe55ba0d761f8be59a69e1/brawlstars.16000106-x1-Hero.png" },
  { id: 48, name: "Набор: Болт", usdPrice: 18.99, label: "Боец Болт", category: "Боец Болт", maxQty: 1, conflictGroup: [], visible: true, image: "https://store.supercell.com/assets/offer-images/brawlstars/85b256626eb1cfcc67ea45c337c3822d7ba5a37820b79486f6940518151f6575/brawlstars.16000106-x1-Hero_23001279-x1-Item_23001280-x1-Item_23001281-x1-Item_23001282-x1-Item.png" },

  // Strikers
  { id: 11, name: "Набор: 3 скина", usdPrice: 24.99, label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [11, 12], visible: true, image: "https://storage.botpapa.me/files/58cac0f0-6032-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 12, name: "Табло Вольт", usdPrice: 8.99, label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [11, 12], visible: true, image: "https://storage.botpapa.me/files/63247140-6032-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 13, name: "Судья Милп", usdPrice: 8.99, label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/673b3200-6032-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 14, name: "Суперфорвард Лу", usdPrice: 13.99, label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/5ed5b090-6032-11f1-af2e-f7a93121b83b.jpeg" },
  
  // Esports
  { id: 15, name: "Победитель Отис", usdPrice: 4.99, label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/12adebb0-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 16, name: "Чемпион мира Гас", usdPrice: 4.99, label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/0de56720-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 17, name: "Яростная Тара", usdPrice: 4.99, label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/08e35c00-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 45, name: "Фанат Фэнг", usdPrice: 4.99, label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/1fdcdc10-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 46, name: "Хоккеист Мортис", usdPrice: 4.99, label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/cd577140-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 18, name: "Кошка-воровка Джесси", usdPrice: 3.99, label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/027f28d0-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Bling Deals
  { id: 19, name: "4000 блингов", usdPrice: 0.99, label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 20, name: "5000 блингов", usdPrice: 4.99, label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 41, name: "8000 блингов", usdPrice: 5.99, label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 42, name: "8500 блингов", usdPrice: 5.99, label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 43, name: "12500 блингов", usdPrice: 7.99, label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 44, name: "20000 блингов", usdPrice: 8.99, label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Еженедельные акции
  { id: 21, name: "Гипнос Сенди", usdPrice: 8.99, label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c079d530-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 22, name: "Фигурка Пенни", usdPrice: 6.99, label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c76b2d30-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 23, name: "Равана Гром", usdPrice: 6.99, label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/ca413090-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 24, name: "Вирус Чарли", usdPrice: 8.99, label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c3f8c2c0-60d0-11f1-af2e-f7a93121b83b.jpeg" },

  // Ежедневные акции
  { id: 35, name: "600 монет", usdPrice: 1.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 36, name: "900 монет", usdPrice: 0.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 37, name: "1100 монет", usdPrice: 3.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 38, name: "1750 монет", usdPrice: 1.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c4c55ad0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 25, name: "50 гемов", usdPrice: 1.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 26, name: "60 гемов", usdPrice: 2.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 27, name: "90 гемов", usdPrice: 0.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 28, name: "95 гемов", usdPrice: 3.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 29, name: "100 гемов", usdPrice: 4.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 30, name: "120 гемов", usdPrice: 5.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 31, name: "140 гемов", usdPrice: 6.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 32, name: "160 гемов", usdPrice: 7.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 33, name: "180 гемов", usdPrice: 8.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 34, name: "180 гемов", usdPrice: 1.99, label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Кристаллы
  { id: 5, name: "30 гемов", usdPrice: 1.99, label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 6, name: "80 гемов", usdPrice: 4.99, label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 7, name: "170 гемов", usdPrice: 8.99, label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 8, name: "360 гемов", usdPrice: 18.99, label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e8aa06c0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 9, name: "950 гемов", usdPrice: 44.99, label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/ec10b160-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 10, name: "2000 гемов", usdPrice: 89.99, label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/767ed1d0-499a-11f1-bef9-f1ec7a2c6e45.jpeg" }
];

const FILTER_CATEGORIES = [
  "Все категории",
  "Пропуски",
  "Боец Болт",
  "Кристаллы",
  "Esports",
  "Strikers",
  "Bling Deals",
  "Особые акции",
  "Ежен. акции",
  "Ежедн. акции"
];

function canAddToCart(productId) {
  const product = products.find(p => p.id == productId);
  if (!product) return { allowed: false, reason: "Товар не найден" };

  const uniqueCount = Object.keys(cart).length;
  if (!cart[productId] && uniqueCount >= 4) {
    return { allowed: false, reason: "В корзину можно добавить не более 4 товаров" };
  }

  const currentQty = cart[productId] || 0;
  if (currentQty >= product.maxQty) {
    return { allowed: false, reason: `Максимум ${product.maxQty} шт.` };
  }

  if (product.conflictGroup && product.conflictGroup.length > 0) {
    const conflicts = product.conflictGroup.filter(id => id !== productId && cart[id]);
    if (conflicts.length > 0) {
      const conflictName = products.find(p => p.id === conflicts[0])?.name || "";
      return { allowed: false, reason: `Удалите "${conflictName}" из корзины, чтобы добавить этот товар` };
    }
  }

  return { allowed: true };
}

function renderFilterModal() {
  const container = document.getElementById("filterOptionsContainer");
  if (!container) return;

  container.innerHTML = FILTER_CATEGORIES.map(cat => `
    <div class="filter-row" data-filter="${cat}">
      <span class="filter-text">${cat}</span>
      <span class="check-mark">${currentFilter === cat ? "✓" : ""}</span>
    </div>
  `).join("");

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