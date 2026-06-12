// Simple cart implementation using localStorage
const CART_KEY = 'restaurant_cart_v1';
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function formatPrice(n) {
    return n.toFixed(2);
}
function addToCart(name, price, modifiers = '') {
    modifiers = (modifiers || '').trim();
    const cart = getCart();
    const idx = cart.findIndex(i => i.name === name && (i.modifiers || '') === modifiers);
    if (idx > -1) {
        cart[idx].qty += 1;
    } else {
        cart.push({ name, price: Number(price), qty: 1, modifiers });
    }
    saveCart(cart);
    renderCart();
    location.hash = '#cart';
}
function updateQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty < 1) cart[index].qty = 1;
    saveCart(cart);
    renderCart();
}
function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}
function calculateTotals(cart) {
    const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;
    return { subtotal, tax, total };
}
function renderCart() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cart = getCart();
    container.innerHTML = '';
    if (!cart.length) {
        container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        if(subtotalEl) subtotalEl.textContent = '0.00';
        if(taxEl) taxEl.textContent = '0.00';
        if(totalEl) totalEl.textContent = '0.00';
        if(checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    const itemsWrap = document.createElement('div');
    cart.forEach((it, i) => {
        const item = document.createElement('div');
        item.className = 'cart-item';
        const info = document.createElement('div');
        info.className = 'cart-item-info';
        let infoHtml = `<div class="cart-item-name">${it.name}</div><div class="cart-item-qty">Qty: ${it.qty}</div>`;
        if (it.modifiers) {
            infoHtml += `<div class="cart-item-modifiers">Modifiers: ${escapeHtml(it.modifiers)}</div>`;
        }
        info.innerHTML = infoHtml;
        const price = document.createElement('div');
        price.innerHTML = `<span class="cart-item-price">$${formatPrice(it.price * it.qty)}</span>`;
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.alignItems = 'center';
        controls.style.gap = '0.5rem';
        const minus = document.createElement('button');
        minus.textContent = '-';
        minus.className = 'remove-btn';
        minus.style.padding = '0.25rem 0.6rem';
        minus.onclick = () => updateQty(i, -1);
        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.className = 'add-to-cart-btn';
        plus.style.padding = '0.25rem 0.6rem';
        plus.onclick = () => updateQty(i, 1);
        const remove = document.createElement('button');
        remove.textContent = 'Remove';
        remove.className = 'remove-btn';
        remove.onclick = () => removeFromCart(i);
        controls.appendChild(minus);
        controls.appendChild(plus);
        controls.appendChild(remove);
        item.appendChild(info);
        item.appendChild(price);
        item.appendChild(controls);
        itemsWrap.appendChild(item);
    });
    container.appendChild(itemsWrap);
    const totals = calculateTotals(cart);
    if(subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if(taxEl) taxEl.textContent = formatPrice(totals.tax);
    if(totalEl) totalEl.textContent = formatPrice(totals.total);
    if(checkoutBtn) checkoutBtn.disabled = false;
}
async function submitOrder(e) {

    e.preventDefault();

    const cart = getCart();

    if (!cart.length) {
        alert('Your cart is empty. Add items before placing an order.');
        return;
    }

    const orderNotes = document.getElementById('order-notes')
        ? document.getElementById('order-notes').value.trim()
        : '';

    const data = {
        notes: orderNotes,
        items: cart,
        totals: calculateTotals(cart)
    };

    console.log('Sending order:', data);

    try {

        const response = await fetch(
            'http://3.211.41.147:5000/api/orders',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();

        alert(
            'Order berhasil dikirim!\n' +
            'Order ID: ' + result.order_id
        );

        localStorage.removeItem(CART_KEY);

        renderCart();

        if (document.getElementById('order-notes')) {
            document.getElementById('order-notes').value = '';
        }

        location.href = 'index.html';

    } catch (err) {

        console.error(err);

        alert(
            'Gagal mengirim order ke server.\n' +
            err.message
        );

    }
}