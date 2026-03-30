// ════════════════════════════════
//   CAFE OF HEAVEN — FAVOURITES JS
//   Works with both localStorage AND PHP API
// ════════════════════════════════

const API = '/COH/public/api'; // Update this path to match your setup
const catEmojis = {
  coffee:'☕', baked:'🥐', cakes:'🎂',
  pizza:'🍕', burger:'🍔', pasta:'🍝', souvenir:'🎁'
};

let currentUser = null;
let isLoading = false;

// ════════════════════════════════
//   CHECK LOGIN STATUS
// ════════════════════════════════
function checkLogin() {
  const user = sessionStorage.getItem('coh_user');
  if (user) {
    try {
      currentUser = JSON.parse(user);
      return currentUser;
    } catch(e) {
      currentUser = null;
    }
  }
  return null;
}

// ════════════════════════════════
//   LOAD ALL SAVED FAVOURITES (API + localStorage)
// ════════════════════════════════
async function loadAllFavs() {
  const all = [];
  const user = checkLogin();

  // ===== 1. LOAD FROM API IF LOGGED IN =====
  if (user && user.email) {
    try {
      const response = await fetch(`${API}/customer/favourites.php?email=${encodeURIComponent(user.email)}&format=detailed`);
      const data = await response.json();
      
      if (data.success && data.data) {
        data.data.forEach(f => {
          // Format API data to match existing structure
          if (f.type === 'menu') {
            all.push({
              id: String(f.item_id),
              type: 'menu',
              emoji: f.emoji || catEmojis[f.item_data?.cat] || '🍽️',
              img: f.image || f.item_data?.img || null,
              name: f.name || f.item_data?.name || 'Menu Item',
              desc: f.item_data?.desc || 'A favourite from our menu.',
              price: f.price || f.item_data?.price || 0,
              cat: f.item_data?.cat || '',
              favourite_id: f.id, // Store API ID for deletion
              saved_at: f.saved_at
            });
          } else if (f.type === 'mood') {
            all.push({
              id: 'mood-' + f.item_id,
              type: 'mood',
              emoji: f.emoji || '☕',
              img: null,
              name: f.name || 'Mood Drink',
              desc: f.item_data?.desc || 'Your saved mood-based recommendation.',
              price: f.price || 0,
              cat: '',
              favourite_id: f.id
            });
          } else if (f.type === 'custom') {
            all.push({
              id: 'custom-' + f.item_id,
              type: 'custom',
              emoji: f.emoji || (f.item_data?.mode === 'coffee' ? '☕' : '🍹'),
              img: null,
              name: f.name || 'Custom Drink',
              desc: f.item_data?.desc || 'Your custom creation.',
              price: f.price || 80,
              cat: '',
              favourite_id: f.id
            });
          }
        });
      }
    } catch(e) {
      console.warn('API favs error, falling back to localStorage:', e);
    }
  }

  // ===== 2. ALWAYS LOAD FROM LOCALSTORAGE (backup) =====
  
  // Menu items (coh_menu_favs)
  try {
    const arr = JSON.parse(localStorage.getItem('coh_menu_favs') || '[]');
    arr.forEach(f => {
      // Avoid duplicates if already loaded from API
      if (!all.some(item => item.type === 'menu' && item.id === String(f.id))) {
        all.push({
          id:    String(f.id),
          type:  'menu',
          emoji: catEmojis[f.cat] || '🍽️',
          img:   f.img  || null,
          name:  f.name || 'Menu Item',
          desc:  f.desc || 'A favourite from our menu.',
          price: f.price || 0,
          cat:   f.cat  || '',
        });
      }
    });
  } catch(e) { console.warn('coh_menu_favs error', e); }

  // Mood picks (coh_favs)
  try {
    const arr = JSON.parse(localStorage.getItem('coh_favs') || '[]');
    arr.forEach(f => {
      const moodId = 'mood-' + String(f.id || f.mood);
      if (!all.some(item => item.type === 'mood' && item.id === moodId)) {
        all.push({
          id:    moodId,
          type:  'mood',
          emoji: f.emoji || '☕',
          img:   null,
          name:  f.name  || 'Mood Drink',
          desc:  'Your saved mood-based recommendation.',
          price: f.price || 0,
          cat:   '',
        });
      }
    });
  } catch(e) { console.warn('coh_favs error', e); }

  // Custom builds (coh_custom_favs)
  try {
    const arr = JSON.parse(localStorage.getItem('coh_custom_favs') || '[]');
    arr.forEach((f, i) => {
      const customId = 'custom-' + i;
      if (!all.some(item => item.type === 'custom' && item.id === customId)) {
        all.push({
          id:    customId,
          type:  'custom',
          emoji: f.mode === 'coffee' ? '☕' : '🍹',
          img:   null,
          name:  f.name || (f.mode === 'coffee' ? 'Custom Coffee' : 'Custom Beverage'),
          desc:  'Custom build — ' + (f.layers ? f.layers.length : 0) + ' ingredients, size ' + (f.size || 'M') + '.',
          price: f.price || 80,
          cat:   '',
        });
      }
    });
  } catch(e) { console.warn('coh_custom_favs error', e); }

  // Sort by saved date (newest first) if available
  all.sort((a, b) => {
    if (a.saved_at && b.saved_at) {
      return new Date(b.saved_at) - new Date(a.saved_at);
    }
    return 0;
  });

  return all;
}

// ════════════════════════════════
//   SYNC LOCALSTORAGE TO API
// ════════════════════════════════
async function syncLocalToAPI() {
  const user = checkLogin();
  if (!user || !user.email) {
    showToast('⚠️ Please login to sync favourites');
    return false;
  }

  showLoading(true);
  showToast('🔄 Syncing favourites...');

  try {
    // Get all local favourites
    const menuFavs = JSON.parse(localStorage.getItem('coh_menu_favs') || '[]');
    const moodFavs = JSON.parse(localStorage.getItem('coh_favs') || '[]');
    const customFavs = JSON.parse(localStorage.getItem('coh_custom_favs') || '[]');

    let synced = 0;
    let errors = 0;

    // Sync menu favourites
    for (const fav of menuFavs) {
      try {
        const response = await fetch(`${API}/customer/favourites.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            type: 'menu',
            item: fav
          })
        });
        const data = await response.json();
        if (data.success) synced++; else errors++;
      } catch(e) { errors++; }
    }

    // Sync mood favourites
    for (const fav of moodFavs) {
      try {
        const response = await fetch(`${API}/customer/favourites.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            type: 'mood',
            item: {
              id: fav.id || fav.mood,
              name: fav.name,
              price: fav.price,
              emoji: fav.emoji,
              desc: fav.desc
            }
          })
        });
        const data = await response.json();
        if (data.success) synced++; else errors++;
      } catch(e) { errors++; }
    }

    // Sync custom favourites
    for (const fav of customFavs) {
      try {
        const response = await fetch(`${API}/customer/favourites.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            type: 'custom',
            item: {
              id: Date.now() + Math.random(),
              name: fav.name,
              price: fav.price,
              mode: fav.mode,
              emoji: fav.mode === 'coffee' ? '☕' : '🍹'
            }
          })
        });
        const data = await response.json();
        if (data.success) synced++; else errors++;
      } catch(e) { errors++; }
    }

    showLoading(false);
    
    if (errors === 0) {
      showToast(`✅ Synced ${synced} favourites to cloud!`);
    } else {
      showToast(`⚠️ Synced ${synced} items, ${errors} failed`);
    }
    
    // Reload to show API favourites
    await render();
    return true;
    
  } catch(e) {
    console.error('Sync error:', e);
    showLoading(false);
    showToast('❌ Sync failed. Check console.');
    return false;
  }
}

// ════════════════════════════════
//   SYNC FAVOURITES (called from button)
// ════════════════════════════════
window.syncFavourites = async function() {
  await syncLocalToAPI();
};

// ════════════════════════════════
//   RENDER
// ════════════════════════════════
async function render() {
  if (isLoading) return;
  
  showLoading(true);
  const items = await loadAllFavs();
  
  const grid      = document.getElementById('favGrid');
  const empty     = document.getElementById('favEmpty');
  const clearWrap = document.getElementById('favClearWrap');
  const countPill = document.getElementById('favCountPill');
  const syncBtn   = document.getElementById('syncFavsBtn');

  // Update count pill
  countPill.textContent = items.length
    ? items.length + ' saved item' + (items.length !== 1 ? 's' : '')
    : '';

  // Show sync button only if logged in
  if (syncBtn) {
    syncBtn.style.display = checkLogin() ? 'inline-flex' : 'none';
  }

  if (items.length === 0) {
    grid.innerHTML = '';
    empty.classList.add('show');
    if (clearWrap) clearWrap.style.display = 'none';
    showLoading(false);
    return;
  }

  empty.classList.remove('show');
  if (clearWrap) clearWrap.style.display = 'block';
  grid.innerHTML = items.map((item, i) => buildCard(item, i)).join('');
  showLoading(false);
}

// ════════════════════════════════
//   BUILD ONE CARD
// ════════════════════════════════
function buildCard(item, idx) {
  const safeId = String(item.id).replace(/[^a-zA-Z0-9]/g, '-') + '-' + idx;

  const imgHtml = item.img
    ? `<img src="${item.img}" alt="${item.name}" loading="lazy"
           style="width:100%;height:100%;object-fit:cover;display:block;"
           onerror="this.style.display='none';document.getElementById('emoji-${safeId}').style.display='flex'">`
    : '';

  const emojiHtml = `<div id="emoji-${safeId}"
    style="display:${item.img ? 'none' : 'flex'};align-items:center;justify-content:center;
           width:100%;height:100%;font-size:3.5rem;background:linear-gradient(135deg,#f5e6cc,#e8d0a8);">
    ${item.emoji}
  </div>`;

  const typeLabel = item.type === 'mood' ? '😊 Mood Pick'
    : item.type === 'custom' ? '🎨 Custom Build'
    : '🍽️ Menu Item';

  // Add data attributes for API deletion
  const dataAttrs = item.favourite_id 
    ? `data-favid="${item.favourite_id}" data-type="${item.type}" data-itemid="${item.id}"`
    : `data-type="${item.type}" data-itemid="${item.id}"`;

  return `
  <div class="fav-card" style="animation-delay:${idx * 0.07}s" id="fc-${safeId}" ${dataAttrs}>
    <div class="fc-img-wrap">
      ${imgHtml}
      ${emojiHtml}
      <span class="fc-type-chip">${typeLabel}</span>
      <button class="fc-remove-btn" onclick="removeItem('${item.id}','${item.type}', '${item.favourite_id || ''}')" title="Remove">✕</button>
    </div>
    <div class="fc-body">
      <div class="fc-name">${item.name}</div>
      <div class="fc-desc">${item.desc}</div>
    </div>
    <div class="fc-footer">
      <div class="fc-price">₹${item.price}</div>
      <button class="fc-cart-btn" id="cartbtn-${safeId}"
        onclick="addToCart('${item.id}','${item.name.replace(/'/g, "\\'")}',${item.price},'${item.img || ''}')">
        🛒 Add to Cart
      </button>
    </div>
  </div>`;
}

// ════════════════════════════════
//   REMOVE ONE ITEM (API + localStorage)
// ════════════════════════════════
window.removeItem = async function(id, type, favouriteId = '') {
  const safeId = String(id).replace(/[^a-zA-Z0-9]/g, '-');
  const card = document.getElementById('fc-' + safeId);
  const user = checkLogin();
  
  if (card) {
    card.style.transition = 'all .28s ease';
    card.style.transform  = 'scale(0.85)';
    card.style.opacity    = '0';
  }

  setTimeout(async () => {
    // ===== REMOVE FROM API IF LOGGED IN =====
    if (user && user.email) {
      try {
        if (favouriteId) {
          // Remove by favourite ID
          await fetch(`${API}/customer/favourites.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              favourite_id: favouriteId
            })
          });
        } else {
          // Remove by item ID and type
          let actualId = id;
          if (type === 'mood') actualId = id.replace('mood-', '');
          if (type === 'custom') actualId = id.replace('custom-', '');
          
          await fetch(`${API}/customer/favourites.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              type: type,
              item_id: actualId
            })
          });
        }
      } catch(e) {
        console.warn('API delete error:', e);
      }
    }

    // ===== REMOVE FROM LOCALSTORAGE =====
    if (type === 'menu') {
      let arr = JSON.parse(localStorage.getItem('coh_menu_favs') || '[]');
      arr = arr.filter(f => String(f.id) !== String(id));
      localStorage.setItem('coh_menu_favs', JSON.stringify(arr));

    } else if (type === 'mood') {
      const moodId = String(id).replace('mood-', '');
      let arr = JSON.parse(localStorage.getItem('coh_favs') || '[]');
      arr = arr.filter(f => String(f.id || f.mood) !== moodId);
      localStorage.setItem('coh_favs', JSON.stringify(arr));

    } else if (type === 'custom') {
      const idx = parseInt(String(id).replace('custom-', ''));
      let arr = JSON.parse(localStorage.getItem('coh_custom_favs') || '[]');
      if (!isNaN(idx)) arr.splice(idx, 1);
      localStorage.setItem('coh_custom_favs', JSON.stringify(arr));
    }

    showToast('🤍 Removed from Favourites');
    render(); // Re-render the page
  }, 280);
};

// ════════════════════════════════
//   ADD TO CART
// ════════════════════════════════
window.addToCart = function(id, name, price, img) {
  const cart = JSON.parse(localStorage.getItem('coh_cart') || '{}');
  const key  = 'fav-' + id;
  
  if (cart[key]) {
    cart[key].qty++;
  } else {
    cart[key] = { 
      name: name, 
      price: Number(price), 
      qty: 1, 
      img: img || '' 
    };
  }
  
  localStorage.setItem('coh_cart', JSON.stringify(cart));
  updateCartCount();

  const safeId = String(id).replace(/[^a-zA-Z0-9]/g, '-');
  const btn = document.getElementById('cartbtn-' + safeId);
  
  if (btn) {
    btn.textContent = '✅ Added!';
    btn.style.background = '#2e7d32';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = '🛒 Add to Cart';
      btn.style.background = '';
      btn.style.color = '';
    }, 1800);
  }

  showToast('🛒 ' + name + ' added to cart!');
};

// ════════════════════════════════
//   CLEAR ALL
// ════════════════════════════════
window.confirmClear = function() { 
  document.getElementById('favModalBg').classList.add('show'); 
};

window.closeModal = function() { 
  document.getElementById('favModalBg').classList.remove('show'); 
};

window.clearAll = async function() {
  const user = checkLogin();
  
  // Clear from API if logged in
  if (user && user.email) {
    try {
      await fetch(`${API}/customer/favourites.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          clear_all: true
        })
      });
    } catch(e) {
      console.warn('API clear error:', e);
    }
  }

  // Clear from localStorage
  localStorage.removeItem('coh_menu_favs');
  localStorage.removeItem('coh_favs');
  localStorage.removeItem('coh_custom_favs');
  
  closeModal();
  showToast('🗑️ All favourites cleared');
  render();
};

// ════════════════════════════════
//   CART COUNT + TOAST
// ════════════════════════════════
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('coh_cart') || '{}');
  const el = document.getElementById('cartCount');
  if (el) el.textContent = Object.values(cart).reduce((s, i) => s + (i.qty || 1), 0);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ════════════════════════════════
//   LOADING INDICATOR
// ════════════════════════════════
function showLoading(show) {
  isLoading = show;
  const loader = document.getElementById('favLoader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}

// ════════════════════════════════
//   INITIALIZATION
// ════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  // Set up modal click handler
  const modal = document.getElementById('favModalBg');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }
  
  // Initial render
  updateCartCount();
  render();
  
  // Check login status for sync button
  const syncBtn = document.getElementById('syncFavsBtn');
  if (syncBtn) {
    syncBtn.style.display = checkLogin() ? 'inline-flex' : 'none';
  }
});

// Add this to favourites.js
function checkSyncButton() {
  const user = sessionStorage.getItem('coh_user');
  const syncBtn = document.getElementById('syncFavsBtn');
  if (user && syncBtn) {
    syncBtn.style.display = 'inline-flex';
  }
}

// Update the existing DOMContentLoaded in favourites.js
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
  render();
  checkSyncButton(); // Add this line
});

// Export functions for HTML onclick (already on window)