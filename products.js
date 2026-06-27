cat > /mnt/user-data/outputs/products.js << 'ENDOFFILE'
const USD_TO_RUB = {
  "0.99": [85, 89], "1.99": [169, 179], "2.49": [209, 219], "2.99": [249, 269],
  "3.99": [339, 359], "4.99": [429, 449], "5.99": [509, 529], "6.99": [589, 619],
  "7.99": [679, 709], "8.99": [769, 799], "9.99": [849, 889], "10.99": [939, 979],
  "11.99": [1019, 1069], "12.99": [1099, 1159], "13.99": [1189, 1249],
  "14.99": [1269, 1339], "15.99": [1359, 1419], "16.99": [1439, 1509],
  "17.99": [1529, 1599], "18.99": [1619, 1689], "19.99": [1699, 1779],
  "24.99": [2129, 2229], "32.99": [2799, 2939], "49.99": [4249, 4449],
  "99.99": [8489, 8899]
};

function getRubPrice(usdPrice, isOld = false) {
  const prices = USD_TO_RUB[usdPrice];
  if (prices) return isOld ? prices[1] : prices[0];
  return Math.round(parseFloat(usdPrice) * (isOld ? 89 : 85));
}

function mapProduct(p) {
  return {
    id: p[0], name: p[1],
    price: getRubPrice(p[2]), oldPrice: getRubPrice(p[3], true),
    label: p[4], category: p[5], maxQty: p[6],
    conflictGroup: p[7], visible: p[8], image: p[9]
  };
}

// products — объединение всех игр, заполняется после загрузки всех JS-файлов игр
// canAddToCart определён в index.html, так как требует доступа к games[]
ENDOFFILE
echo "done"