// Cafe of Heaven - Order Functions

// ========== PLACE ORDER ==========
async function placeOrder() {
    const cart = window.getCart ? window.getCart() : [];
    
    if (cart.length === 0) {
        showMessage('Your cart is empty!', 'error');
        return;
    }
    
    const name = document.getElementById('customer-name')?.value;
    const email = document.getElementById('customer-email')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    
    if (!name || !email || !phone) {
        showMessage('Please fill all fields', 'error');
        return;
    }
    
    const orderData = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        items: cart.map(item => ({
            menuItemId: item.id,
            itemName: item.name,
            quantity: item.quantity,
            unitPrice: item.price
        }))
    };
    
    try {
        showLoading(true);
        const response = await fetch('https://localhost:7120/api/Orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const order = await response.json();
            showMessage(`✅ Order placed! ID: ${order.orderNumber}`, 'success');
            window.clearCart();
            
            // Clear form
            if (document.getElementById('customer-name')) {
                document.getElementById('customer-name').value = '';
                document.getElementById('customer-email').value = '';
                document.getElementById('customer-phone').value = '';
            }
            
            // Show success
            const summary = document.getElementById('order-summary');
            if (summary) {
                summary.innerHTML = `
                    <div class="order-success">
                        <h3>🎉 Order Confirmed!</h3>
                        <p>Order: ${order.orderNumber}</p>
                        <p>Total: ₹${order.totalAmount}</p>
                        <p>📧 Email sent to ${order.customerEmail}</p>
                    </div>
                `;
                summary.style.display = 'block';
            }
        } else {
            showMessage('Order failed', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== LOADING ==========
function showLoading(show) {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}