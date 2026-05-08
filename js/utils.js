function formatPrice(p) { 
  return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "₽"; 
}

function escapeHtml(str) { 
  if (!str) return ''; 
  return str.replace(/[&<>]/g, function(m) { 
    if (m === '&') return '&amp;'; 
    if (m === '<') return '&lt;'; 
    if (m === '>') return '&gt;'; 
    return m; 
  }); 
}

function hapticLight() {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
  }
}

function hapticMedium() {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
  }
}

function getPaymentMethodLabel(value) {
  const opt = paymentMethodsOptions.find(o => o.value === value);
  return opt ? `${opt.label}` : '';
}

function getBankFromValue(value) {
  const opt = paymentMethodsOptions.find(o => o.value === value);
  return opt ? opt.label : '';
}

function getCardNumberFromValue(value) {
  const bank = getBankFromValue(value);
  return cardNumbers[bank] || "";
}