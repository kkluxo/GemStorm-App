const USD_TO_RUB = {
  "0.99": [85, 89], "1.99": [169, 179], "2.49": [209, 219], "2.99": [249, 269], "3.99": [339, 359], "4.99": [429, 449], "5.99": [509, 529], "6.99": [589, 619], "7.99": [679, 709], "8.99": [769, 799], "9.99": [849, 889], "10.99": [939, 979], "11.99": [1019, 1069],
  "12.99": [1099, 1159], "13.99": [1189, 1249], "14.99": [1269, 1339], "15.99": [1359, 1419], "16.99": [1439, 1509], "17.99": [1529, 1599], "18.99": [1619, 1689], "19.99": [1699, 1779],
  "24.99": [2129, 2229], "32.99": [2799, 2939], "49.99": [4249, 4449], "99.99": [8489, 8899]
};

function getRubPrice(usdPrice, isOld = false) {
  const prices = USD_TO_RUB[usdPrice];
  if (prices) return isOld ? prices[1] : prices[0];
  return Math.round(parseFloat(usdPrice) * (isOld ? 89 : 85));
}

function makeProducts(raw, prefix) {
  return raw.map(p => ({
    id: prefix + p[0],
    name: p[1],
    price: getRubPrice(p[2]),
    oldPrice: getRubPrice(p[3], true),
    label: p[4], category: p[5], maxQty: p[6],
    conflictGroup: p[7].map(id => prefix + id),
    visible: p[8], image: p[9]
  }));
}

const brawlRaw = [
  // Пропуски
  [1, "Brawl Pass", "8.99", "8.99", "Пропуск", "Пропуски", 1, [1,2,3], true, "https://storage.botpapa.me/files/6b57bf60-499a-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[1, "Brawl Pass", "8.99", "8.99", "Пропуск", "Пропуски", 1, [1,2,3], true, "https://i.postimg.cc/DyRqmtSg/D95D9FEE-84F7-4CA2-BAAC-19CD16D3DF46.jpg"],
  [2, "Brawl Pass Plus", "12.99", "12.99", "Пропуск", "Пропуски", 1, [1,2,3], true, "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [3, "Улучш. до BP+", "4.99", "4.99", "Пропуск", "Пропуски", 1, [1,2,3], true, "https://storage.botpapa.me/files/6f97da10-499a-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[2, "Brawl Pass Plus", "12.99", "12.99", "Пропуск", "Пропуски", 1, [1,2,3], true, "https://i.postimg.cc/xT98fQyk/36B450E9-74F4-4E76-B66D-2FD81B0592D7.jpg"],
  //[3, "Улучш. до BP+", "4.99", "4.99", "Пропуск", "Пропуски", 1, [1,2,3], true, "https://i.postimg.cc/xT98fQyk/36B450E9-74F4-4E76-B66D-2FD81B0592D7.jpg"],
  [4, "Pro Pass", "24.99", "24.99", "Пропуск", "Пропуски", 1, [], true, "https://storage.botpapa.me/files/72f535e0-499a-11f1-bef9-f1ec7a2c6e45.jpeg"],
  
  // Боец Болт
  //[47, "Боец Болт", "8.99", "9.99", "Боец Болт", "Боец Болт", 1, [47,48], true, "https://store.supercell.com/assets/offer-images/brawlstars/ab15739c18373b4c23c775819fc499026cc0a0f6abbe55ba0d761f8be59a69e1/brawlstars.16000106-x1-Hero.png"],
  //[48, "Набор: Болт", "18.99", "18.99", "Боец Болт", "Боец Болт", 1, [47,48], true, "https://store.supercell.com/assets/offer-images/brawlstars/85b256626eb1cfcc67ea45c337c3822d7ba5a37820b79486f6940518151f6575/brawlstars.16000106-x1-Hero_23001279-x1-Item_23001280-x1-Item_23001281-x1-Item_23001282-x1-Item.png"],
  
  // Гиперзарядные скины
  //[84, "Монарх Рико", "16.99", "16.99", "Гипер. скин", "Гипер. скины", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/0be3e4ba65f42da3d73f1a29c8e9b20d7f680baa32d7d2ba83d0b088cd0c9b8e/brawlstars.29000920-x1-Skin_5000000-x250-Gems_5000001-x1500-Coins.png"],
  //[85, "Кристальный монарх Рико", "16.99", "16.99", "Гипер. скин", "Гипер. скины", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/718a2b8d839df2274c2fae1cff838514648f1e3167320d1add4c6452929929c0/brawlstars.29000926-x1-Skin_5000001-x3000-Coins_5000022-x500-PowerPoints.png"],
  //[86, "Блинговый монарх Рико", "16.99", "16.99", "Гипер. скин", "Гипер. скины", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/a404d18b7d0eee32a92b53c8b1a58a67f22377e3cbf60ddbf7b9436e4ffc0f38/brawlstars.29000925-x1-Skin_5000023-x10000-Bling_5000001-x1000-Coins.png"],

  // Моя геройская академия
  //[49, "Набор: MHA", "32.99", "32.99", "MHA", "Hero Academy", 1, [49,50,51,52,53], true, "https://store.supercell.com/assets/offer-images/brawlstars/df876f611fb401294842243f161f4d32c5ee10a9381114ce27aedb75bdb6cac8/brawlstars.29001603-x1-Skin_29001598-x1-Skin_29001597-x1-Skin_29001596-x1-Skin.png"],
  //[50, "Томура Сигараки Гас", "9.99", "9.99", "MHA", "Hero Academy", 1, [49,50], true, "https://store.supercell.com/assets/offer-images/brawlstars/c4750e2c419aad6253eccdc2be2f7aefca730e5a91667d60d5943125075c7226/brawlstars.29001597-x1-Skin.png"],
  //[51, "Деку Фэнг", "7.99", "7.99", "MHA", "Hero Academy", 1, [49,51], true, "https://store.supercell.com/assets/offer-images/brawlstars/045fdd3cf0c31c2f5d269919227048617b4e693ede08071e6174de7867131132/brawlstars.29001598-x1-Skin.png"],
  //[52, "Всемогущий Эль Примо", "13.99", "13.99", "MHA", "Hero Academy", 1, [49,52], true, "https://store.supercell.com/assets/offer-images/brawlstars/cd373618e8c19d219c0c127fd6fe1c8ec8e3587c744de3b08c7cfca39649ee8c/brawlstars.29001603-x1-Skin.png"],
  //[53, "Бакуго Эдгар", "9.99", "9.99", "MHA", "Hero Academy", 1, [49,53], true, "https://store.supercell.com/assets/offer-images/brawlstars/05d23915f6f720cba5b06b728e5b17369ee9dc70b2eecbecfb76f4b277eb5c6b/brawlstars.29001596-x1-Skin.png"],
  //[61, "Уравити Джанет", "7.99", "7.99", "MHA", "Hero Academy", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/567884c788d3b7ddd622c00b7f9455b95c80f9ee77938a2d2b59256dcb4365f0/brawlstars.29001595-x1-Skin.png"],

  // Strikers
  [11, "Набор: 3 скина", "24.99", "24.99", "Strikers", "Strikers", 1, [11,12], true, "https://storage.botpapa.me/files/58cac0f0-6032-11f1-af2e-f7a93121b83b.jpeg"],
  [12, "Табло Вольт", "9.99", "9.99", "Strikers", "Strikers", 1, [11,12], true, "https://storage.botpapa.me/files/63247140-6032-11f1-af2e-f7a93121b83b.jpeg"],
  [13, "Судья Милп", "9.99", "9.99", "Strikers", "Strikers", 1, [], true, "https://storage.botpapa.me/files/673b3200-6032-11f1-af2e-f7a93121b83b.jpeg"],
  [14, "Суперфорвард Лу", "14.99", "14.99", "Strikers", "Strikers", 1, [], true, "https://storage.botpapa.me/files/5ed5b090-6032-11f1-af2e-f7a93121b83b.jpeg"],
  
  // Esports
  //[15, "Победитель Отис", "4.99", "4.99", "Esports", "Esports", 1, [], true, "https://storage.botpapa.me/files/12adebb0-505b-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[16, "Чемпион мира Гас", "4.99", "4.99", "Esports", "Esports", 1, [], true, "https://storage.botpapa.me/files/0de56720-505b-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[17, "Яростная Тара", "4.99", "4.99", "Esports", "Esports", 1, [], true, "https://storage.botpapa.me/files/08e35c00-505b-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[45, "Фанат Фэнг", "4.99", "4.99", "Esports", "Esports", 1, [], true, "https://storage.botpapa.me/files/1fdcdc10-505b-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[46, "Хоккеист Мортис", "4.99", "4.99", "Esports", "Esports", 1, [], true, "https://storage.botpapa.me/files/cd577140-60d0-11f1-af2e-f7a93121b83b.jpeg"],
  //[18, "Кошка-воровка Джесси", "3.99", "3.99", "Esports", "Esports", 1, [], true, "https://storage.botpapa.me/files/027f28d0-505b-11f1-bef9-f1ec7a2c6e45.jpeg"],
  
  // Особые акции
  //[58, "90 гемов", "0.99", "0.99", "Особая акция", "Особые акции", 1, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[59, "150 гемов", "4.99", "4.99", "Особая акция", "Особые акции", 1, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  //[60, "300 гемов", "9.99", "9.99", "Особая акция", "Особые акции", 1, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  
  // Еженедельные акции
  //[21, "Гипнос Сенди", "8.99", "8.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://storage.botpapa.me/files/c079d530-60d0-11f1-af2e-f7a93121b83b.jpeg"],
  //[22, "Фигурка Пенни", "6.99", "6.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://storage.botpapa.me/files/c76b2d30-60d0-11f1-af2e-f7a93121b83b.jpeg"],
  //[23, "Равана Гром", "6.99", "6.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://storage.botpapa.me/files/ca413090-60d0-11f1-af2e-f7a93121b83b.jpeg"],
  //[24, "Вирус Чарли", "8.99", "8.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://storage.botpapa.me/files/c3f8c2c0-60d0-11f1-af2e-f7a93121b83b.jpeg"],
  //[55, "Злая королева Пэм", "8.99", "8.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/94f663077bdf674241b0e60705aa2949eb3e96a5c4bd9672f6540bc29b5e6d00/brawlstars.29000354-x1-Skin.png"],
  //[56, "Арджуна Бо", "6.99", "6.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/6fe55fe9ac9cde53a0eef8ad9a63909fc063ca6cb5de88a78438f192d138f6e7/brawlstars.29000731-x1-Skin.png"],
  //[57, "Снежная королева Амбер", "8.99", "8.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/c49da0d47d2b1873a81c33dcbd6e6b501155b205266ddfe6ec8db2a290168037/brawlstars.29000597-x1-Skin.png"],
  //[80, "Карнавальная Менди", "6.99", "6.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/26766d0e3f1ff7b9ef68509a6b9de650255dc046f9a9b0633cb6a14995f0f360/brawlstars.29001111-x1-Skin.png"],
  //[81, "Зевс Брок", "6.99", "6.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/ad1e2810ae49f4e2d18f6e91accdfa29aff3c35a188e7c8434c0dfa8e17f955d/brawlstars.29000656-x1-Skin.png"],
  //[82, "Призрачный всадник Драко", "8.99", "8.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/9052f82dbec7d57547803a640d3c5b095010210866ff378b6ab3062dd75b66c4/brawlstars.29000943-x1-Skin.png"],
  //[83, "Родео Хэнк", "6.99", "6.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/0cfd49ba9b17b30f2e64a6219d645b0504bb908afa30d82ab8568e456c227a95/brawlstars.29000700-x1-Skin.png"],
  [87, "Мультяшка Спайк", "8.99", "8.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/048776f4a9468a4cd1a6fc66f5e8e15702efa22fbe09b1b7f0df3ec8f86faefe/brawlstars.29000751-x1-Skin.png"],
  [88, "Тор Биби", "8.99", "8.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/d398d33e7c4a095bcf7004263a875546f6ae89ff3a29981231a802f2203bcd68/brawlstars.29000782-x1-Skin.png"],
  [89, "Афина Пайпер", "6.99", "6.99", "Ежен. акция", "Ежен. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/6c2cb81e55fa2174a3aa082ea998343e6ae4bfe7e445c96e8a37fa51d40cd2d7/brawlstars.29000905-x1-Skin.png"],

  // Bling Deals
  [19, "4000 блингов", "0.99", "0.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [20, "5000 блингов", "4.99", "4.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [41, "8000 блингов", "5.99", "5.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [42, "8500 блингов", "5.99", "5.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [75, "12000 блингов", "7.99", "7.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [43, "12500 блингов", "7.99", "7.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [54, "16000 блингов", "8.99", "8.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [44, "20000 блингов", "8.99", "8.99", "Bling Deal", "Bling Deals", 1, [], true, "https://storage.botpapa.me/files/80188ea0-591e-11f1-bef9-f1ec7a2c6e45.jpeg"],
    
  // Esports
  //[62, "Набор: SK Gaming", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/a9e85d7aa92b4f683fc527706f8ff5263720706ff378c6be6574aaec9e698850/brawlstars.52002969-x1-Emote_28001084-x1-PlayerIcon_68000621-x1-Spray.png"],
  //[63, "Набор: ZETA Division", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/1ee7c3e247a03e25e2ce750c3db253ddccafe4426b636a2850b8b69c3d5c36b8/brawlstars.52002973-x1-Emote_28001079-x1-PlayerIcon_68000618-x1-Spray.png"],
  //[64, "Набор: LOUD", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/f9d9d9042d346be24549212b444933e9b9971f6ca8083ec8134e149838f2fd40/brawlstars.52002967-x1-Emote_28001082-x1-PlayerIcon_68000623-x1-Spray.png"],
  //[65, "Набор: Team Heretics", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/ff20de05be75d8f80d8e10575ae291c1fc33a4b06c1f190c2d35adb14d66735f/brawlstars.52002970-x1-Emote_28001080-x1-PlayerIcon_68000625-x1-Spray.png"],
  //[66, "Набор: Reply Totem", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/d3909ff03606482bff39463f35c43d26e7e5ae60ca90a8dc9231afa9b191c611/brawlstars.52002971-x1-Emote_28001085-x1-PlayerIcon_68000620-x1-Spray.png"],
  //[67, "Набор: Natus Vincere", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/2bb41e466aac7b4b3b4e02ad9289d1d870e0c029df9b121c85df99d28b8fc122/brawlstars.52002968-x1-Emote_28001083-x1-PlayerIcon_68000622-x1-Spray.png"],
  //[68, "Набор: TRIBE Gaming", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/05c7be5bffb46e300be32d4a2f6a52f7460c31d1be7b7b642f755d81098be152/brawlstars.52002972-x1-Emote_28001086-x1-PlayerIcon_68000619-x1-Spray.png"],
  //[69, "Набор: Crazy Raccoon", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/300f2062942967da7ff70a86efab6c0c364ffba4f4b622dd7568a06ae5ab3779/brawlstars.52003059-x1-Emote_28001243-x1-PlayerIcon_68000679-x1-Spray.png"],
  //[70, "Набор: HMBLE", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/aacf62c69e2720d0bb517dae00040e36246f0ef29973b94d4b0a4fc9be5fe55e/brawlstars.52002966-x1-Emote_28001081-x1-PlayerIcon_68000624-x1-Spray.png"],
  //[71, "Набор: FUT Esports", "2.49", "2.49", "Esports", "Esports", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/f87e8c285d976feb500ccd540ee4dddff9e4fd04e6dc5a43ed909b7d4568e3af/brawlstars.52002964-x1-Emote_28001077-x1-PlayerIcon_68000626-x1-Spray.png"],
  
  // Ежедневные акции
  [76, "500 монет", "1.99", "1.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [35, "600 монет", "1.99", "1.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [36, "900 монет", "0.99", "0.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [37, "1100 монет", "3.99", "3.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [78, "1255 монет", "4.99", "4.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/c04d8e50-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [38, "1750 монет", "1.99", "1.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/c4c55ad0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [39, "900 очков силы", "0.99", "0.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/bc0695d0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [40, "1000 очков силы", "2.99", "2.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/bc0695d0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [75, "1800 очков силы", "1.99", "1.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/bc0695d0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [79, "2000 очков силы", "6.99", "6.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/bc0695d0-56ba-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [72, "750 монет + 500 оч. силы", "4.99", "4.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/9bc29cdd973f19b44f87eda5ea57ea51749e55e6672b08d0eaac744217bbf7bf/brawlstars.5000001-x750-Coins_5000022-x500-PowerPoints.png"],
  [73, "1400 монет + 800 оч. силы", "6.99", "6.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/9bc29cdd973f19b44f87eda5ea57ea51749e55e6672b08d0eaac744217bbf7bf/brawlstars.5000001-x750-Coins_5000022-x500-PowerPoints.png"],
  [74, "1500 монет + 900 оч. силы", "6.99", "6.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/9bc29cdd973f19b44f87eda5ea57ea51749e55e6672b08d0eaac744217bbf7bf/brawlstars.5000001-x750-Coins_5000022-x500-PowerPoints.png"],
  [77, "2000 монет + 500 оч. силы", "7.99", "7.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://store.supercell.com/assets/offer-images/brawlstars/9bc29cdd973f19b44f87eda5ea57ea51749e55e6672b08d0eaac744217bbf7bf/brawlstars.5000001-x750-Coins_5000022-x500-PowerPoints.png"],
  [25, "50 гемов", "1.99", "1.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [26, "60 гемов", "2.99", "2.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [27, "90 гемов", "0.99", "0.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [28, "95 гемов", "3.99", "3.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [29, "100 гемов", "4.99", "4.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [30, "120 гемов", "5.99", "5.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [31, "140 гемов", "6.99", "6.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [32, "160 гемов", "7.99", "7.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [33, "180 гемов", "8.99", "8.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [34, "180 гемов", "1.99", "1.99", "Ежедн. акция", "Ежедн. акции", 1, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  
  // Кристаллы
  [5, "30 гемов", "1.99", "1.99", "Кристаллы", "Кристаллы", 3, [], true, "https://storage.botpapa.me/files/de7124e0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [6, "80 гемов", "4.99", "4.99", "Кристаллы", "Кристаллы", 3, [], true, "https://storage.botpapa.me/files/e2281260-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [7, "170 гемов", "8.99", "8.99", "Кристаллы", "Кристаллы", 3, [], true, "https://storage.botpapa.me/files/e5928d90-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [8, "360 гемов", "19.99", "19.99", "Кристаллы", "Кристаллы", 3, [], true, "https://storage.botpapa.me/files/e8aa06c0-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [9, "950 гемов", "49.99", "49.99", "Кристаллы", "Кристаллы", 3, [], true, "https://storage.botpapa.me/files/ec10b160-4a1d-11f1-bef9-f1ec7a2c6e45.jpeg"],
  [10, "2000 гемов", "99.99", "99.99", "Кристаллы", "Кристаллы", 3, [], true, "https://storage.botpapa.me/files/767ed1d0-499a-11f1-bef9-f1ec7a2c6e45.jpeg"]
];
window.brawlProducts = makeProducts(brawlRaw, 'bs_');
window.products = window.brawlProducts; // для обратной совместимости

// ===== CLASH ROYALE =====
const crRaw = [
  [1, "Pass Royale", "11.99", "11.99", "Пропуски", "Пропуски", 1, [], true, "https://store.supercell.com/assets/offer-images/clashroyale/c220364329b3742e4ffbab70be0869f8a54e8843e0393381c07e0d9e7bc11d75/clashroyale.5000050-x1-SeasonPass.png"],
  [2, "Мини-пропуск", "3.99", "3.99", "Пропуски", "Пропуски", 1, [], true, "https://store.supercell.com/assets/offer-images/clashroyale/37c6222472d10746cfaf28ebb20ea8b93cd81ab413e82969bae016b9c9603b30/clashroyale.664434-x1-MiniPass.png"],
  [3, "80 гемов", "0.99", "0.99", "Кристаллы", "Кристаллы", 1, [], true, "https://store.supercell.com/assets/offer-images/clashroyale/fceb25deefb2473a93e0820c7720bceb00102c8639f25b05e64616f539f2359b/clashroyale.5000000-x80-Gems.png"],
  [4, "500 гемов", "4.99", "4.99", "Кристаллы", "Кристаллы", 1, [], true, "https://store.supercell.com/assets/offer-images/clashroyale/bfc2cd8fbbee541961ec21770b63ac4bbf5809707cbe71d901a3e0837e6b30bb/clashroyale.5000000-x500-Gems.png"],
  [5, "1200 гемов", "9.99", "9.99", "Кристаллы", "Кристаллы", 1, [], true, "https://store.supercell.com/assets/offer-images/clashroyale/80b3cdf4ab35523da4fc0e935d02c1a6f5adc7aa06cd11a382e4648036d8ca79/clashroyale.5000000-x1200-Gems.png"],
  [6, "2500 гемов", "19.99", "19.99", "Кристаллы", "Кристаллы", 1, [], true, "https://store.supercell.com/assets/offer-images/clashroyale/7414bf980a9f3de2ea7e7dbf893c5813ff8e2ce112d78019764eb4156f61be65/clashroyale.5000000-x2500-Gems.png"],


];
window.crProducts = makeProducts(crRaw, 'cr_');

// ===== CLASH OF CLANS =====
const cocRaw = [
  [1, "Название товара", "1.99", "1.99", "Категория", "Категория", 1, [], true, "URL"],
  // ...
];
window.cocProducts = makeProducts(cocRaw, 'coc_');

const hdRaw = [
  [1, "Название товара", "1.99", "1.99", "Категория", "Категория", 1, [], true, "URL"],
  // ...
];
window.hdProducts = makeProducts(hdRaw, 'hd_');

// ===== ROBLOX =====
const robloxRaw = [
  [1, "80 робуксов", "0.49", "0.49", "Робуксы", "Робуксы", 1, [], true, "https://i.postimg.cc/Wzy4fm0g/06BADDD1-A06A-4C6F-B498-E73C85183DE5.jpg"],
  [2, "80 робуксов", "0.99", "0.99", "Робуксы", "Робуксы", 1, [], true, "https://i.postimg.cc/Wzy4fm0g/06BADDD1-A06A-4C6F-B498-E73C85183DE5.jpg"],
  [3, "400 робуксов", "4.99", "4.99", "Робуксы", "Робуксы", 1, [], true, "https://i.postimg.cc/Wzy4fm0g/06BADDD1-A06A-4C6F-B498-E73C85183DE5.jpg"],
  [4, "800 робуксов", "9.99", "9.99", "Робуксы", "Робуксы", 1, [], true, "https://i.postimg.cc/Wzy4fm0g/06BADDD1-A06A-4C6F-B498-E73C85183DE5.jpg"],
  [5, "1200 робуксов", "14.99", "14.99", "Робуксы", "Робуксы", 1, [], true, "https://i.postimg.cc/Wzy4fm0g/06BADDD1-A06A-4C6F-B498-E73C85183DE5.jpg"],
  [6, "1700 робуксов", "19.99", "19.99", "Робуксы", "Робуксы", 1, [], true, "https://i.postimg.cc/Wzy4fm0g/06BADDD1-A06A-4C6F-B498-E73C85183DE5.jpg"],

];
window.robloxProducts = makeProducts(robloxRaw, 'roblox_');

const tgRaw = [
  [1, "Премиум 3 месяца", "1.99", "1.99", "Категория", "Категория", 1, [], true, "URL"],
  // ...
];
window.tgProducts = makeProducts(tgRaw, 'tg_');

const products = window.brawlProducts;
window.products = products;