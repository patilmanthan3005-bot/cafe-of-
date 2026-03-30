// ============================================
// NAVBAR.JS - Updates navbar based on login status
// Run this on every page
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Update account link based on login status
  const accountLink = document.getElementById('accountLink');
  const user = sessionStorage.getItem('coh_user');
  
  if (accountLink) {
    if (user) {
      // User is logged in
      accountLink.href = 'account.html';
      accountLink.innerHTML = '👤 My Account';
    } else {
      // User is not logged in
      accountLink.href = 'login.html';
      accountLink.innerHTML = '👤 Login';
    }
  }
  
  // Update cart count
  const cartCount = document.getElementById('cartCount');
  if (cartCount) {
    const cart = JSON.parse(localStorage.getItem('coh_cart') || '{}');
    cartCount.textContent = Object.values(cart).reduce((s, i) => s + (i.qty || 1), 0);
  }
});

// Also update when localStorage changes (if user logs in from another tab)
window.addEventListener('storage', function(e) {
  if (e.key === 'coh_user' || e.key === 'coh_cart') {
    // Update account link
    const accountLink = document.getElementById('accountLink');
    const user = sessionStorage.getItem('coh_user');
    
    if (accountLink) {
      if (user) {
        accountLink.href = 'account.html';
        accountLink.innerHTML = '👤 My Account';
      } else {
        accountLink.href = 'login.html';
        accountLink.innerHTML = '👤 Login';
      }
    }
    
    // Update cart count
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      const cart = JSON.parse(localStorage.getItem('coh_cart') || '{}');
      cartCount.textContent = Object.values(cart).reduce((s, i) => s + (i.qty || 1), 0);
    }
  }
});