// === КОНФИГУРАЦИЯ ЦЕН (ДОЛЛАР → РУБЛИ) ===
// Формат: "цена_в_долларах": { rub: "текущая_цена_в_рублях", oldRub: "старая_цена_в_рублях" }
const USD_TO_RUB = {
  "0.99": { rub: 85, oldRub: 89 },
  "1.99": { rub: 169, oldRub: 179 },
  "2.99": { rub: 249, oldRub: 269 },
  "3.99": { rub: 339, oldRub: 359 },
  "4.99": { rub: 429, oldRub: 449 },
  "5.99": { rub: 509, oldRub: 529 },
  "6.99": { rub: 589, oldRub: 619 },
  "7.99": { rub: 679, oldRub: 709 },
  "8.99": { rub: 769, oldRub: 799 },
  "9.99": { rub: 849, oldRub: 889 },
  "10.99": { rub: 939, oldRub: 979 },
  "11.99": { rub: 1019, oldRub: 1069 },
  "12.99": { rub: 1099, oldRub: 1159 },
  "13.99": { rub: 1189, oldRub: 1249 },
  "14.99": { rub: 1269, oldRub: 1339 },
  "15.99": { rub: 1359, oldRub: 1419 },
  "16.99": { rub: 1439, oldRub: 1509 },
  "17.99": { rub: 1529, oldRub: 1599 },
  "18.99": { rub: 1619, oldRub: 1689 },
  "19.99": { rub: 1699, oldRub: 1779 },
  "24.99": { rub: 2129, oldRub: 2229 },
  "44.99": { rub: 3949, oldRub: 4249 },
  "48.99": { rub: 4249, oldRub: 4549 },
  "89.99": { rub: 7899, oldRub: 8469 },
  "96.99": { rub: 8469, oldRub: 8999 }
};

// Функция получения рублёвой цены по доллару
function getRubPrice(usdPrice, isOld = false) {
  const prices = USD_TO_RUB[usdPrice];
  if (prices) {
    return isOld ? prices.oldRub : prices.rub;
  }
  // fallback: если цена не найдена
  return isOld ? Math.round(parseFloat(usdPrice) * 89) : Math.round(parseFloat(usdPrice) * 85);
}

// === ТОВАРЫ (цены в рублях для совместимости с основным кодом) ===
const products = [
  // Пропуски
  { id: 1, name: "Brawl Pass", price: getRubPrice("8.99"), oldPrice: getRubPrice("8.99", true), label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [1, 2, 3], visible: true, image: "https://storage.botpapa.me/files/6b57bf60-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 2, name: "Brawl Pass Plus", price: getRubPrice("12.99"), oldPrice: getRubPrice("12.99", true), label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [1, 2, 3], visible: true, image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 3, name: "Улучш. до BP+", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [1, 2, 3], visible: true, image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 4, name: "Pro Pass", price: getRubPrice("24.99"), oldPrice: getRubPrice("24.99", true), label: "Пропуск", category: "Пропуски", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/72f535e0-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Боец Болт
  { id: 47, name: "Боец Болт", price: getRubPrice("8.99"), oldPrice: getRubPrice("9.99", true), label: "Боец Болт", category: "Боец Болт", maxQty: 1, conflictGroup: [], visible: true, image: "https://store.supercell.com/assets/offer-images/brawlstars/ab15739c18373b4c23c775819fc499026cc0a0f6abbe55ba0d761f8be59a69e1/brawlstars.16000106-x1-Hero.png" },
  { id: 48, name: "Набор: Болт", price: getRubPrice("18.99"), oldPrice: getRubPrice("9.99", true), label: "Боец Болт", category: "Боец Болт", maxQty: 1, conflictGroup: [], visible: true, image: "https://store.supercell.com/assets/offer-images/brawlstars/85b256626eb1cfcc67ea45c337c3822d7ba5a37820b79486f6940518151f6575/brawlstars.16000106-x1-Hero_23001279-x1-Item_23001280-x1-Item_23001281-x1-Item_23001282-x1-Item.png" },

  // Strikers
  { id: 11, name: "Набор: 3 скина", price: getRubPrice("24.99"), oldPrice: getRubPrice("24.99", true), label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [11, 12], visible: true, image: "https://storage.botpapa.me/files/58cac0f0-6032-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 12, name: "Табло Вольт", price: getRubPrice("8.99"), oldPrice: getRubPrice("9.99", true), label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [11, 12], visible: true, image: "https://storage.botpapa.me/files/63247140-6032-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 13, name: "Судья Милп", price: getRubPrice("8.99"), oldPrice: getRubPrice("9.99", true), label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/673b3200-6032-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 14, name: "Суперфорвард Лу", price: getRubPrice("13.99"), oldPrice: getRubPrice("14.99", true), label: "Strikers", category: "Strikers", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/5ed5b090-6032-11f1-af2e-f7a93121b83b.jpeg" },
  
  // Esports
  { id: 15, name: "Победитель Отис", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/12adebb0-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 16, name: "Чемпион мира Гас", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/0de56720-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 17, name: "Яростная Тара", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/08e35c00-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 45, name: "Фанат Фэнг", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/1fdcdc10-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 46, name: "Хоккеист Мортис", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/cd577140-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 18, name: "Кошка-воровка Джесси", price: getRubPrice("3.99"), oldPrice: getRubPrice("3.99", true), label: "Esports", category: "Esports", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/027f28d0-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Bling Deals
  { id: 19, name: "4000 блингов", price: getRubPrice("0.99"), oldPrice: getRubPrice("0.99", true), label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 20, name: "5000 блингов", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 41, name: "8000 блингов", price: getRubPrice("5.99"), oldPrice: getRubPrice("5.99", true), label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 42, name: "8500 блингов", price: getRubPrice("5.99"), oldPrice: getRubPrice("5.99", true), label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 43, name: "12500 блингов", price: getRubPrice("7.99"), oldPrice: getRubPrice("7.99", true), label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 44, name: "20000 блингов", price: getRubPrice("8.99"), oldPrice: getRubPrice("9.99", true), label: "Bling Deal", category: "Bling Deals", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Еженедельные акции
  { id: 21, name: "Гипнос Сенди", price: getRubPrice("8.99"), oldPrice: getRubPrice("8.99", true), label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c079d530-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 22, name: "Фигурка Пенни", price: getRubPrice("6.99"), oldPrice: getRubPrice("6.99", true), label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c76b2d30-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 23, name: "Равана Гром", price: getRubPrice("6.99"), oldPrice: getRubPrice("6.99", true), label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/ca413090-60d0-11f1-af2e-f7a93121b83b.jpeg" },
  { id: 24, name: "Вирус Чарли", price: getRubPrice("8.99"), oldPrice: getRubPrice("8.99", true), label: "Ежен. акция", category: "Ежен. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c3f8c2c0-60d0-11f1-af2e-f7a93121b83b.jpeg" },

  // Ежедневные акции (монеты, гемы, сила)
  { id: 35, name: "600 монет", price: getRubPrice("1.99"), oldPrice: getRubPrice("1.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 36, name: "900 монет", price: getRubPrice("0.99"), oldPrice: getRubPrice("0.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 37, name: "1100 монет", price: getRubPrice("3.99"), oldPrice: getRubPrice("3.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 38, name: "1750 монет", price: getRubPrice("1.99"), oldPrice: getRubPrice("1.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/c4c55ad0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 39, name: "900 очков силы", price: getRubPrice("0.99"), oldPrice: getRubPrice("0.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: false, image: "https://storage.botpapa.me/files/bc0695d0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 40, name: "1000 очков силы", price: getRubPrice("2.99"), oldPrice: getRubPrice("2.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: false, image: "https://storage.botpapa.me/files/bc0695d0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 25, name: "50 гемов", price: getRubPrice("1.99"), oldPrice: getRubPrice("1.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 26, name: "60 гемов", price: getRubPrice("2.99"), oldPrice: getRubPrice("2.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 27, name: "90 гемов", price: getRubPrice("0.99"), oldPrice: getRubPrice("0.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 28, name: "95 гемов", price: getRubPrice("3.99"), oldPrice: getRubPrice("3.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 29, name: "100 гемов", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 30, name: "120 гемов", price: getRubPrice("5.99"), oldPrice: getRubPrice("5.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 31, name: "140 гемов", price: getRubPrice("6.99"), oldPrice: getRubPrice("6.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 32, name: "160 гемов", price: getRubPrice("7.99"), oldPrice: getRubPrice("7.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 33, name: "180 гемов", price: getRubPrice("8.99"), oldPrice: getRubPrice("8.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 34, name: "180 гемов", price: getRubPrice("1.99"), oldPrice: getRubPrice("1.99", true), label: "Ежедн. акция", category: "Ежедн. акции", maxQty: 1, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // Кристаллы
  { id: 5, name: "30 гемов", price: getRubPrice("1.99"), oldPrice: getRubPrice("1.99", true), label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 6, name: "80 гемов", price: getRubPrice("4.99"), oldPrice: getRubPrice("4.99", true), label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 7, name: "170 гемов", price: getRubPrice("8.99"), oldPrice: getRubPrice("9.99", true), label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 8, name: "360 гемов", price: getRubPrice("18.99"), oldPrice: getRubPrice("19.99", true), label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/e8aa06c0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 9, name: "950 гемов", price: getRubPrice("44.99"), oldPrice: getRubPrice("48.99", true), label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/ec10b160-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },
  { id: 10, name: "2000 гемов", price: getRubPrice("89.99"), oldPrice: getRubPrice("96.99", true), label: "Кристаллы", category: "Кристаллы", maxQty: 3, conflictGroup: [], visible: true, image: "https://storage.botpapa.me/files/767ed1d0-499a-11f1-bef9-f1ec7a2c6e45.jpeg" }
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