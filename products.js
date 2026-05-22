const products = [

  // ── ПРОПУСКИ (id 1–4) ─────────────────────────────────────────────────────
  // id   name                price   oldPrice  label       category
  {  id: 1,  name: "Brawl Pass",      price: 769,  oldPrice: 799,  label: "Пропуск", category: "Пропуски",
     image: "https://storage.botpapa.me/files/6b57bf60-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 2,  name: "Brawl Pass Plus", price: 1099, oldPrice: 1169, label: "Пропуск", category: "Пропуски",
     image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 3,  name: "Улучш. до BP+",   price: 429,  oldPrice: 449,  label: "Пропуск", category: "Пропуски",
     image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 4,  name: "Pro Pass",         price: 2129, oldPrice: 2249, label: "Пропуск", category: "Пропуски",
     image: "https://storage.botpapa.me/files/72f535e0-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // ── СТАРР НОВА (id 11–18) ─────────────────────────────────────────────────
  // id   name                price   oldPrice  label          category
  {  id: 11, name: "Набор: 4 скина",  price: 3149, oldPrice: 3289, label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/a99938f0-4a56-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 12, name: "Набор: 3 скина",  price: 2379, oldPrice: 2489, label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/ac8cd670-4a56-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 13, name: "Скин Амбер",      price: 1269, oldPrice: 1329, label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/b3c4fb70-4a56-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 14, name: "Скин Амбер",      price: 1269, oldPrice: 1329, label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/b6be6550-4a56-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 15, name: "Скин Джуджу",     price: 849,  oldPrice: 889,  label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/ba4da690-4a56-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 16, name: "Скин Беа",        price: 679,  oldPrice: 709,  label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/bd39a2f0-4a56-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 17, name: "Скин Ворон",      price: 769,  oldPrice: 799,  label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/3ec3c760-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 18, name: "Скин Сту",        price: 769,  oldPrice: 799,  label: "Старр Нова", category: "Старр Нова",
     image: "https://storage.botpapa.me/files/42c44100-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // ── ОСОБЫЕ АКЦИИ (id 19–20) ───────────────────────────────────────────────
  // id   name               price   oldPrice  label          category
  {  id: 19, name: "Скин Байрон",     price: 589,  oldPrice: 619,  label: "Особ. акция", category: "Особые акции",
     image: "https://storage.botpapa.me/files/3b8b31a0-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 20, name: "Скин Джесси",     price: 339,  oldPrice: 359,  label: "Особ. акция", category: "Особые акции",
     image: "https://storage.botpapa.me/files/027f28d0-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // ── ЕЖЕНЕДЕЛЬНЫЕ АКЦИИ (id 21–24) ────────────────────────────────────────
  // id   name            price   oldPrice  label          category
  {  id: 21, name: "Скин Тара",        price: 429,  oldPrice: 449,  label: "Ежен. акция", category: "Еженедельные акции",
     image: "https://storage.botpapa.me/files/08e35c00-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 22, name: "Скин Отис",        price: 429,  oldPrice: 449,  label: "Ежен. акция", category: "Еженедельные акции",
     image: "https://storage.botpapa.me/files/12adebb0-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 23, name: "Скин Фэнг",        price: 429,  oldPrice: 449,  label: "Ежен. акция", category: "Еженедельные акции",
     image: "https://storage.botpapa.me/files/1fdcdc10-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 24, name: "Скин Гас",         price: 429,  oldPrice: 449,  label: "Ежен. акция", category: "Еженедельные акции",
     image: "https://storage.botpapa.me/files/0de56720-505b-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // ── ЕЖЕДНЕВНЫЕ АКЦИИ (id 25–36) ──────────────────────────────────────────
  // id   name           price   oldPrice  label           category
  {  id: 25, name: "Акция Джеки",      price: 849,  oldPrice: 889,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/729a3ba0-4edf-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 26, name: "50 гемов",         price: 169,  oldPrice: 179,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 27, name: "60 гемов",         price: 249,  oldPrice: 269,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 28, name: "90 гемов",         price: 85,   oldPrice: 89,   label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 29, name: "95 гемов",         price: 339,  oldPrice: 359,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 30, name: "100 гемов",        price: 429,  oldPrice: 449,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 31, name: "120 гемов",        price: 509,  oldPrice: 529,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 32, name: "140 гемов",        price: 589,  oldPrice: 619,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 33, name: "160 гемов",        price: 679,  oldPrice: 709,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 34, name: "180 гемов",        price: 769,  oldPrice: 799,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 35, name: "180 гемов",        price: 169,  oldPrice: 179,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 36, name: "200 гемов",        price: 849,  oldPrice: 889,  label: "Ежедн. акция", category: "Ежедневные акции",
     image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  // ── КРИСТАЛЛЫ (id 5–10) ───────────────────────────────────────────────────
  // id   name           price   oldPrice  label          category
  {  id: 5,  name: "30 гемов",   price: 169,  oldPrice: 179,  label: "Кристаллы", category: "Кристаллы",
     image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 6,  name: "80 гемов",   price: 429,  oldPrice: 449,  label: "Кристаллы", category: "Кристаллы",
     image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 7,  name: "170 гемов",  price: 849,  oldPrice: 889,  label: "Кристаллы", category: "Кристаллы",
     image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 8,  name: "360 гемов",  price: 1699, oldPrice: 1779, label: "Кристаллы", category: "Кристаллы",
     image: "https://storage.botpapa.me/files/e8aa06c0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 9,  name: "950 гемов",  price: 4249, oldPrice: 4449, label: "Кристаллы", category: "Кристаллы",
     image: "https://storage.botpapa.me/files/ec10b160-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg" },

  {  id: 10, name: "2000 гемов", price: 8469, oldPrice: 8899, label: "Кристаллы", category: "Кристаллы",
     image: "https://storage.botpapa.me/files/767ed1d0-499a-11f1-bef9-f1ec7a2c6e45.jpeg" },

];

// ─────────────────────────────────────────────
//  КАТЕГОРИИ ФИЛЬТРА (порядок отображения в меню)
// ─────────────────────────────────────────────
const FILTER_CATEGORIES = [
  "Все категории",
  "Пропуски",
  "Старр Нова",
  "Особые акции",
  "Еженедельные акции",
  "Ежедневные акции",
  "Кристаллы",
];

// ─────────────────────────────────────────────
//  ФУНКЦИЯ ФИЛЬТРА
//  Удалите оригинальную renderFilterModal() из index.html
// ─────────────────────────────────────────────
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