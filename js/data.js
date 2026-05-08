// Товары
const products = [
  { id: 1, name: "Brawl Pass", price: 769, oldPrice: 799, image: "https://storage.botpapa.me/files/6b57bf60-499a-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 2, name: "Улучш. до BP+", price: 429, oldPrice: 449, image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 3, name: "Brawl Pass Plus", price: 1099, oldPrice: 1169, image: "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 4, name: "Pro Pass", price: 2129, oldPrice: 2249, image: "https://storage.botpapa.me/files/72f535e0-499a-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 5, name: "30 гемов", price: 169, oldPrice: 179, image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 6, name: "80 гемов", price: 429, oldPrice: 449, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 7, name: "170 гемов", price: 849, oldPrice: 889, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 8, name: "360 гемов", price: 1699, oldPrice: 1779, image: "https://storage.botpapa.me/files/e8aa06c0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 9, name: "950 гемов", price: 4249, oldPrice: 4449, image: "https://storage.botpapa.me/files/ec10b160-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 10, name: "2000 гемов", price: 8469, oldPrice: 8899, image: "https://storage.botpapa.me/files/767ed1d0-499a-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 11, name: "Набор: 4 скина", price: 3149, oldPrice: 3289, image: "https://storage.botpapa.me/files/a99938f0-4a56-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 12, name: "Набор: 3 скина", price: 2379, oldPrice: 2489, image: "https://storage.botpapa.me/files/ac8cd670-4a56-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 13, name: "Скин Амбер", price: 1269, oldPrice: 1329, image: "https://storage.botpapa.me/files/b3c4fb70-4a56-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 14, name: "Скин Амбер", price: 1269, oldPrice: 1329, image: "https://storage.botpapa.me/files/b6be6550-4a56-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 15, name: "Скин Джуджу", price: 849, oldPrice: 889, image: "https://storage.botpapa.me/files/ba4da690-4a56-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 16, name: "Скин Беа", price: 679, oldPrice: 709, image: "https://storage.botpapa.me/files/bd39a2f0-4a56-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 17, name: "50 гемов", price: 169, oldPrice: 179, image: "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 18, name: "60 гемов", price: 249, oldPrice: 269, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 19, name: "90 гемов", price: 85, oldPrice: 89, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 20, name: "95 гемов", price: 339, oldPrice: 359, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 21, name: "100 гемов", price: 429, oldPrice: 449, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 22, name: "120 гемов", price: 509, oldPrice: 529, image: "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 23, name: "140 гемов", price: 589, oldPrice: 619, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 24, name: "160 гемов", price: 679, oldPrice: 709, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 25, name: "180 гемов", price: 769, oldPrice: 799, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" },
  { id: 26, name: "180 гемов", price: 169, oldPrice: 179, image: "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg", category: "Brawl Stars" }
];

// Промокоды
const promoCodes = {
  "SALE10": 10,
  "SALE20": 20,
  "GELTAN": 15,
  "WELCOME": 5
};

// Карты банков
const cardNumbers = {
  "Т-Банк": "2200 7019 3499 0208",
  "ВТБ Банк": "2200 2418 6382 9697",
  "Сбер Банк": "2202 2084 4441 4743",
  "Ozon Банк": "2204 3203 9062 7166",
  "Альфа Банк": "2200 1529 6836 2817"
};

// Способы оплаты
const paymentMethodsOptions = [
  { value: "tbank", label: "Т-Банк" },
  { value: "vtb", label: "ВТБ Банк" },
  { value: "sber", label: "Сбер Банк" },
  { value: "ozon", label: "Ozon Банк" },
  { value: "alfa", label: "Альфа Банк" }
];