// ============================================
// ACCOUNT PAGE JS - Cafe of Heaven
// Handles: Profile, Addresses, Orders, Settings
// API Connected to PHP Backend
// ============================================

const API = '/COH/public/api'; // Update this to match your path

// State Management
let currentUser = null;
let currentSection = 'profile';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateCartCount();
    setupEventListeners();
});

function setupEventListeners() {
    // Handle mobile menu
    window.toggleMenu = () => {
        document.querySelector('.nav-links').classList.toggle('show');
    };
    
    // Handle hash navigation
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
        handleHashChange();
    }
}

function handleHashChange() {
    const section = window.location.hash.replace('#', '') || 'profile';
    showSection(section);
}

// ============================================
// AUTHENTICATION
// ============================================
function checkAuth() {
    const user = sessionStorage.getItem('coh_user');
    if (!user) {
        window.location.href = 'login.html?redirect=account.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(user);
        loadUserData();
    } catch (e) {
        console.error('Auth error:', e);
        window.location.href = 'login.html';
    }
}

// ============================================
// LOAD USER DATA FROM API
// ============================================
async function loadUserData() {
    showLoading();
    
    try {
        // Fetch full user profile from API
        const response = await fetch(`${API}/customer/get.php?email=${encodeURIComponent(currentUser.email)}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            currentUser = { ...currentUser, ...data.data };
            updateProfileUI();
        } else {
            // Fallback to localStorage
            loadUserFromLocal();
        }
    } catch (error) {
        console.warn('API error, using localStorage:', error);
        loadUserFromLocal();
    }
    
    hideLoading();
    showSection(currentSection);
}

function loadUserFromLocal() {
    const accounts = JSON.parse(localStorage.getItem('coh_accounts') || '[]');
    const account = accounts.find(a => a.email === currentUser.email);
    if (account) {
        currentUser = { ...currentUser, ...account };
    }
    updateProfileUI();
}

function updateProfileUI() {
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const avatarEl = document.getElementById('profileAvatar');
    const joinEl = document.getElementById('profileJoin');
    
    if (nameEl) nameEl.textContent = currentUser.name || 'Customer';
    if (emailEl) emailEl.textContent = currentUser.email || '';
    
    // Set avatar initials
    if (avatarEl) {
        const initials = (currentUser.name || 'U').charAt(0).toUpperCase();
        avatarEl.textContent = initials;
    }
    
    // Join date
    if (joinEl) {
        const joinDate = currentUser.joined ? new Date(currentUser.joined).getFullYear() : '2026';
        joinEl.textContent = `Member since ${joinDate}`;
    }
}

// ============================================
// SECTION MANAGEMENT
// ============================================
window.showSection = function(section) {
    currentSection = section;
    
    // Update URL hash
    window.location.hash = section;
    
    // Update active menu
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    const menuItem = document.getElementById(`menu-${section}`);
    if (menuItem) menuItem.classList.add('active');
    
    // Load section content
    switch(section) {
        case 'profile':
            loadProfileSection();
            break;
        case 'addresses':
            loadAddressesSection();
            break;
        case 'orders':
            loadOrdersSection();
            break;
        case 'favourites':
            loadFavouritesSection();
            break;
        case 'settings':
            loadSettingsSection();
            break;
    }
};

// ============================================
// PROFILE SECTION
// ============================================
function loadProfileSection() {
    const content = document.getElementById('accountContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="profile-section">
            <h2 class="section-title">Profile Information</h2>
            
            <div class="info-grid">
                <div class="info-field">
                    <div class="info-label"><span>👤</span> Full Name</div>
                    <div class="info-value" id="displayName">${escapeHtml(currentUser.name || 'Not set')}</div>
                </div>
                
                <div class="info-field">
                    <div class="info-label"><span>📧</span> Email Address</div>
                    <div class="info-value" id="displayEmail">${escapeHtml(currentUser.email)}</div>
                </div>
                
                <div class="info-field">
                    <div class="info-label"><span>📱</span> Phone Number</div>
                    <div class="info-value" id="displayPhone">${escapeHtml(currentUser.phone || 'Not set')}</div>
                </div>
                
                <div class="info-field">
                    <div class="info-label"><span>🎂</span> Date of Birth</div>
                    <div class="info-value" id="displayDob">${escapeHtml(currentUser.dob || 'Not set')}</div>
                </div>
            </div>
            
            <button class="edit-btn" onclick="editProfile()">
                <span>✏️</span> Edit Profile
            </button>
        </div>
    `;
}

// ============================================
// EDIT PROFILE - FIXED VERSION
// ============================================
window.editProfile = function() {
    // Format date for input if exists
    let dobValue = currentUser.dob || '';
    if (dobValue && !dobValue.includes('-')) {
        try {
            const date = new Date(dobValue);
            if (!isNaN(date.getTime())) {
                dobValue = date.toISOString().split('T')[0];
            }
        } catch(e) {}
    }
    
    const modalContent = `
        <div class="modal-content" style="max-width: 500px;">
            <h3 style="color: var(--brown); margin-bottom: 20px;">Edit Profile</h3>
            <form id="editProfileForm" onsubmit="saveProfile(event)">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--brown); font-weight: 600;">Full Name</label>
                    <input type="text" name="name" value="${escapeHtml(currentUser.name || '')}" required
                           style="width: 100%; padding: 12px; border: 2px solid var(--cream); border-radius: 12px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--brown); font-weight: 600;">Email</label>
                    <input type="email" value="${escapeHtml(currentUser.email)}" disabled readonly
                           style="width: 100%; padding: 12px; border: 2px solid #eee; border-radius: 12px; background: #f9f9f9; font-size: 1rem;">
                    <small style="color: #999; display: block; margin-top: 5px;">Email cannot be changed</small>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--brown); font-weight: 600;">Phone Number</label>
                    <input type="tel" name="phone" value="${escapeHtml(currentUser.phone || '')}" required
                           pattern="[0-9+\-\s]{10,15}" 
                           style="width: 100%; padding: 12px; border: 2px solid var(--cream); border-radius: 12px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--brown); font-weight: 600;">Birthday</label>
                    <input type="date" name="dob" value="${escapeHtml(dobValue)}"
                           style="width: 100%; padding: 12px; border: 2px solid var(--cream); border-radius: 12px; font-size: 1rem;">
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    <button type="button" onclick="closeModal()" 
                            style="flex: 1; padding: 14px; border: 2px solid #ddd; border-radius: 30px; background: white; color: #666; font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Cancel
                    </button>
                    <button type="submit" 
                            style="flex: 1; padding: 14px; border: none; border-radius: 30px; background: var(--gold); color: white; font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    
    showModal('edit-profile-modal', modalContent);
};

// ============================================
// SAVE PROFILE - FIXED VERSION
// ============================================
window.saveProfile = async function(event) {
    event.preventDefault();
    
    const form = document.getElementById('editProfileForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {
        email: currentUser.email,
        name: formData.get('name') || currentUser.name,
        phone: formData.get('phone') || currentUser.phone,
        dob: formData.get('dob') || currentUser.dob || ''
    };
    
    console.log('Saving profile data:', data); // Debug log
    
    // Show loading state
    const saveBtn = form.querySelector('button[type="submit"]');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        // First update in localStorage (always works)
        const accounts = JSON.parse(localStorage.getItem('coh_accounts') || '[]');
        const accountIndex = accounts.findIndex(a => a.email === currentUser.email);
        
        if (accountIndex !== -1) {
            accounts[accountIndex] = { 
                ...accounts[accountIndex], 
                name: data.name,
                phone: data.phone,
                dob: data.dob
            };
            localStorage.setItem('coh_accounts', JSON.stringify(accounts));
            console.log('✅ Updated localStorage accounts');
        }
        
        // Update sessionStorage
        currentUser = { ...currentUser, ...data };
        sessionStorage.setItem('coh_user', JSON.stringify(currentUser));
        
        // Try to update via API (don't fail if API not available)
        let apiSuccess = false;
        try {
            const response = await fetch(`${API}/customer/update.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            console.log('API response:', result);
            
            if (result.success) {
                apiSuccess = true;
            }
        } catch (apiError) {
            console.warn('API error, but saved to localStorage:', apiError);
        }
        
        // Update UI
        const displayName = document.getElementById('displayName');
        const displayPhone = document.getElementById('displayPhone');
        const displayDob = document.getElementById('displayDob');
        const profileName = document.getElementById('profileName');
        const profileAvatar = document.getElementById('profileAvatar');
        
        if (displayName) displayName.textContent = data.name || 'Not set';
        if (displayPhone) displayPhone.textContent = data.phone || 'Not set';
        if (displayDob) displayDob.textContent = data.dob || 'Not set';
        if (profileName) profileName.textContent = data.name || 'Customer';
        if (profileAvatar) {
            const initials = (data.name || 'U').charAt(0).toUpperCase();
            profileAvatar.textContent = initials;
        }
        
        // Show success message
        if (apiSuccess) {
            showToast('✅ Profile updated successfully!');
        } else {
            showToast('✅ Profile saved (offline mode)');
        }
        
        closeModal();
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('❌ Error saving profile');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
};

// ============================================
// ADDRESSES SECTION
// ============================================
async function loadAddressesSection() {
    const content = document.getElementById('accountContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="addresses-section">
            <h2 class="section-title">Saved Addresses</h2>
            <button class="edit-btn" onclick="showAddAddressModal()">
                <span>➕</span> Add New Address
            </button>
            <div id="addressesList" class="loading">Loading addresses...</div>
        </div>
    `;
    
    await loadAddresses();
}

async function loadAddresses() {
    try {
        const response = await fetch(`${API}/customer/addresses.php?email=${encodeURIComponent(currentUser.email)}`);
        const data = await response.json();
        
        if (data.success) {
            renderAddresses(data.data || []);
        } else {
            renderAddresses([]);
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        renderAddresses([]);
    }
}

function renderAddresses(addresses) {
    const list = document.getElementById('addressesList');
    if (!list) return;
    
    if (!addresses || addresses.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📍</div>
                <p>No saved addresses yet.</p>
                <p style="font-size:0.85rem; color:var(--text-mid);">Add an address to speed up checkout</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = addresses.map((addr, index) => `
        <div class="address-card">
            <div class="address-type">
                <span>${escapeHtml(addr.type || 'Home')}</span>
                ${addr.is_default ? '<span class="default-badge">Default</span>' : ''}
            </div>
            <div class="address-text">${escapeHtml(addr.address)}</div>
            <div class="address-actions">
                <button onclick="editAddress(${index}, '${addr.id}')">
                    ✏️ Edit
                </button>
                <button onclick="deleteAddress(${index}, '${addr.id}')">
                    🗑️ Delete
                </button>
                ${!addr.is_default ? `
                    <button onclick="setDefaultAddress(${index}, '${addr.id}')">
                        ⭐ Set Default
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

window.showAddAddressModal = function() {
    const modalContent = `
        <div class="modal-content">
            <h3>Add New Address</h3>
            <form id="addressForm" onsubmit="saveAddress(event)">
                <div class="form-group">
                    <label>Address Type</label>
                    <select name="type" required>
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Full Address</label>
                    <textarea name="address" rows="3" required 
                        placeholder="Street, City, State, PIN Code"></textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="is_default"> Set as default address
                    </label>
                </div>
                <div class="modal-actions">
                    <button type="button" onclick="closeModal()">Cancel</button>
                    <button type="submit">Save Address</button>
                </div>
            </form>
        </div>
    `;
    
    showModal('address-modal', modalContent);
};

window.saveAddress = async function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {
        email: currentUser.email,
        type: formData.get('type'),
        address: formData.get('address'),
        is_default: formData.get('is_default') === 'on'
    };
    
    try {
        const response = await fetch(`${API}/customer/addresses.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Address saved!');
            closeModal();
            loadAddresses();
        } else {
            showToast('❌ Failed to save address');
        }
    } catch (error) {
        console.error('Save address error:', error);
        showToast('❌ Error saving address');
    }
};

window.deleteAddress = async function(index, addressId) {
    if (!confirm('Delete this address?')) return;
    
    try {
        const response = await fetch(`${API}/customer/addresses.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                address_id: addressId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('🗑️ Address deleted');
            loadAddresses();
        } else {
            showToast('❌ Failed to delete address');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Error deleting address');
    }
};

// ============================================
// ORDERS SECTION
// ============================================
async function loadOrdersSection() {
    const content = document.getElementById('accountContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="orders-section">
            <h2 class="section-title">Order History</h2>
            <div id="ordersList" class="loading">Loading orders...</div>
        </div>
    `;
    
    await loadOrderHistory();
}

async function loadOrderHistory() {
    try {
        const response = await fetch(`${API}/orders/get.php?email=${encodeURIComponent(currentUser.email)}`);
        const data = await response.json();
        
        if (data.success) {
            renderOrders(data.data || []);
        } else {
            renderOrders([]);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        renderOrders([]);
    }
}

function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    if (!list) return;
    
    if (!orders || orders.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No orders yet.</p>
                <p style="font-size:0.85rem; color:var(--text-mid);">
                    <a href="menu.html" style="color:var(--gold);">Browse our menu</a> and place your first order!
                </p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>Order #${escapeHtml(order.order_number)}</h4>
                <p>${new Date(order.placed_at).toLocaleDateString()} • ₹${order.total}</p>
                <p style="font-size:0.8rem;">${order.items ? Object.keys(order.items).length : 0} items</p>
            </div>
            <span class="order-status status-${(order.order_status || 'pending').toLowerCase()}">
                ${order.order_status || 'Pending'}
            </span>
        </div>
    `).join('');
}

// ============================================
// FAVOURITES SECTION
// ============================================
async function loadFavouritesSection() {
    const content = document.getElementById('accountContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="favourites-section">
            <h2 class="section-title">My Favourites</h2>
            <div id="favouritesList" class="loading">Loading favourites...</div>
        </div>
    `;
    
    await loadFavourites();
}

async function loadFavourites() {
    try {
        const response = await fetch(`${API}/customer/favourites.php?email=${encodeURIComponent(currentUser.email)}`);
        const data = await response.json();
        
        if (data.success) {
            renderFavourites(data.data || []);
        } else {
            renderFavourites([]);
        }
    } catch (error) {
        console.error('Error loading favourites:', error);
        renderFavourites([]);
    }
}

function renderFavourites(favourites) {
    const list = document.getElementById('favouritesList');
    if (!list) return;
    
    if (!favourites || favourites.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❤️</div>
                <p>No favourites yet.</p>
                <p style="font-size:0.85rem; color:var(--text-mid);">
                    Browse the menu and click the heart icon to save your favourites!
                </p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = `
        <div class="fav-grid">
            ${favourites.map(fav => `
                <div class="fav-card">
                    <div class="fav-emoji" style="font-size:2.5rem;">${fav.emoji || '🍽️'}</div>
                    <div class="fav-name">${escapeHtml(fav.name)}</div>
                    <div class="fav-price">₹${fav.price}</div>
                    <button class="fav-add-btn" onclick="addFavouriteToCart(${fav.item_id})">
                        Add to Cart
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

window.addFavouriteToCart = function(itemId) {
    const cart = JSON.parse(localStorage.getItem('coh_cart') || '{}');
    const key = `item-${itemId}`;
    
    if (cart[key]) {
        cart[key].qty++;
    } else {
        cart[key] = { id: itemId, qty: 1 };
    }
    
    localStorage.setItem('coh_cart', JSON.stringify(cart));
    updateCartCount();
    showToast('🛒 Added to cart!');
};

// ============================================
// SETTINGS SECTION
// ============================================
async function loadSettingsSection() {
    const content = document.getElementById('accountContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="settings-section">
            <h2 class="section-title">Settings</h2>
            
            <div class="settings-option">
                <div>
                    <strong>Email Notifications</strong>
                    <p>Receive order updates and offers via email</p>
                </div>
                <div class="toggle-switch" id="emailNotifications" 
                     onclick="toggleSetting('emailNotifications')"></div>
            </div>
            
            <div class="settings-option">
                <div>
                    <strong>SMS Notifications</strong>
                    <p>Get order status updates on your phone</p>
                </div>
                <div class="toggle-switch" id="smsNotifications" 
                     onclick="toggleSetting('smsNotifications')"></div>
            </div>
            
            <div class="settings-option">
                <div>
                    <strong>Dark Mode</strong>
                    <p>Switch to dark theme for night viewing</p>
                </div>
                <div class="toggle-switch" id="darkMode" 
                     onclick="toggleSetting('darkMode')"></div>
            </div>
            
            <div class="settings-option">
                <div>
                    <strong>Language</strong>
                    <p>Select your preferred language</p>
                </div>
                <select class="lang-select" id="language" onchange="changeLanguage(this.value)">
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                </select>
            </div>
            
            <div style="margin-top: 30px;">
                <button class="edit-btn" onclick="changePassword()">
                    <span>🔑</span> Change Password
                </button>
                
                <button class="logout-btn" onclick="logout()" style="margin-top: 15px;">
                    <span>🚪</span> Logout
                </button>
            </div>
        </div>
    `;
    
    await loadSettings();
}

async function loadSettings() {
    try {
        const response = await fetch(`${API}/customer/settings.php?email=${encodeURIComponent(currentUser.email)}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const settings = data.data;
            
            // Update toggles
            const emailNotif = document.getElementById('emailNotifications');
            const smsNotif = document.getElementById('smsNotifications');
            const darkMode = document.getElementById('darkMode');
            const language = document.getElementById('language');
            
            if (emailNotif) emailNotif.classList.toggle('active', settings.emailNotifications || false);
            if (smsNotif) smsNotif.classList.toggle('active', settings.smsNotifications || false);
            if (darkMode) darkMode.classList.toggle('active', settings.darkMode || false);
            
            // Update language
            if (language && settings.language) {
                language.value = settings.language;
            }
            
            // Apply dark mode
            if (settings.darkMode) {
                document.body.classList.add('dark-mode');
            }
        }
    } catch (error) {
        console.warn('Error loading settings:', error);
    }
}

window.toggleSetting = async function(setting) {
    const el = document.getElementById(setting);
    if (!el) return;
    
    el.classList.toggle('active');
    const isActive = el.classList.contains('active');
    
    try {
        await fetch(`${API}/customer/settings.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                setting: setting,
                value: isActive
            })
        });
        
        if (setting === 'darkMode') {
            document.body.classList.toggle('dark-mode', isActive);
        }
        
        showToast(`⚙️ ${setting} updated`);
    } catch (error) {
        console.error('Error saving setting:', error);
    }
};

window.changeLanguage = async function(lang) {
    try {
        await fetch(`${API}/customer/settings.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                setting: 'language',
                value: lang
            })
        });
        showToast('🌐 Language updated');
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

window.changePassword = function() {
    const modalContent = `
        <div class="modal-content">
            <h3>Change Password</h3>
            <form id="passwordForm" onsubmit="updatePassword(event)">
                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" name="current" required>
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" name="new" required minlength="6">
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" name="confirm" required minlength="6">
                </div>
                <div class="modal-actions">
                    <button type="button" onclick="closeModal()">Cancel</button>
                    <button type="submit">Update Password</button>
                </div>
            </form>
        </div>
    `;
    
    showModal('password-modal', modalContent);
};

window.updatePassword = async function(event) {
    event.preventDefault();
    const form = event.target;
    const current = form.current.value;
    const newPass = form.new.value;
    const confirm = form.confirm.value;
    
    if (newPass !== confirm) {
        showToast('❌ Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API}/customer/update.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                current_password: current,
                new_password: newPass
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Password updated!');
            closeModal();
        } else {
            showToast('❌ ' + (result.message || 'Failed to update password'));
        }
    } catch (error) {
        console.error('Password update error:', error);
        showToast('❌ Error updating password');
    }
};

// ============================================
// LOGOUT
// ============================================
window.logout = function() {
    sessionStorage.removeItem('coh_user');
    sessionStorage.removeItem('coh_logged_in');
    window.location.href = 'login.html';
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = 'block';
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('coh_cart') || '{}');
    const count = Object.values(cart).reduce((s, i) => s + (i.qty || 1), 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
}

// Modal Functions
function showModal(id, content) {
    // Remove existing modal if any
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    modal.innerHTML = content;
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Show modal
    setTimeout(() => modal.classList.add('show'), 10);
}

window.closeModal = function() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    setTimeout(() => {
        document.querySelectorAll('.modal').forEach(m => m.remove());
    }, 300);
};

// Add modal styles if not already present
if (!document.getElementById('modal-styles')) {
    const modalStyles = document.createElement('style');
    modalStyles.id = 'modal-styles';
    modalStyles.textContent = `
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }
        .modal.show {
            display: flex;
        }
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .modal-content h3 {
            color: var(--brown);
            margin-bottom: 20px;
            font-family: 'Playfair Display', serif;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--brown);
            font-weight: 600;
            font-size: 0.9rem;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--cream);
            border-radius: 12px;
            font-size: 1rem;
            font-family: 'Lato', sans-serif;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--gold);
        }
        .modal-actions {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }
        .modal-actions button {
            flex: 1;
            padding: 14px;
            border-radius: 30px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
        }
        .modal-actions button[type="button"] {
            background: #eee;
            color: #666;
        }
        .modal-actions button[type="button"]:hover {
            background: #ddd;
        }
        .modal-actions button[type="submit"] {
            background: var(--gold);
            color: white;
        }
        .modal-actions button[type="submit"]:hover {
            background: var(--brown);
            transform: translateY(-2px);
        }
        .modal-actions button[type="submit"]:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(modalStyles);
}