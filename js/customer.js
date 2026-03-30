// Cafe of Heaven - Customer Frontend JS

const API_BASE = 'https://localhost:7120/api';

// ========== LOAD MENU ==========
async function loadMenu() {
    try {
        const response = await fetch(`${API_BASE}/Menu`);
        const items = await response.json();
        return items;
    } catch (error) {
        console.error('Error loading menu:', error);
        showMessage('Failed to load menu', 'error');
        return [];
    }
}

// ========== DISPLAY MENU ==========
function displayMenu(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p class="empty-message">No items available</p>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="menu-card" data-id="${item.id}">
            <div class="menu-image">
                <img src="${item.imageUrl || 'images/placeholder.jpg'}" alt="${item.name}">
            </div>
            <div class="menu-info">
                <h3>${item.name}</h3>
                <p class="description">${item.description || 'Delicious item from Cafe of Heaven'}</p>
                <div class="price-row">
                    <span class="price">₹${item.price}</span>
                    <button onclick="addToCart(${item.id}, '${item.name}', ${item.price})" class="add-to-cart-btn">
                        🛒 Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== SHOW MESSAGE ==========
function showMessage(message, type = 'info') {
    const msgContainer = document.getElementById('message-container');
    if (msgContainer) {
        msgContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
        setTimeout(() => {
            msgContainer.innerHTML = '';
        }, 3000);
    } else {
        alert(message);
    }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
    const items = await loadMenu();
    displayMenu(items, 'menu-container');
});