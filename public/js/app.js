// Client-side app logic
// Handles catalog browsing, search, and cart management

const cart = {}; // { partNumber: { part, qty } }

// --- Page navigation ---

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    showPage(page);
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`${name}-page`).classList.add('active');
  if (name === 'cart') renderCart();
}

// --- Catalog ---

async function loadCatalog(query = '') {
  const grid = document.getElementById('catalog-grid');
  grid.innerHTML = '<p class="loading">Loading...</p>';

  const url = query
    ? `/api/catalog/search?q=${encodeURIComponent(query)}`
    : '/api/catalog';

  try {
    const res = await fetch(url);
    const parts = await res.json();

    if (!res.ok) {
      grid.innerHTML = `<p class="error-msg">${parts.error || 'Failed to load parts.'}</p>`;
      return;
    }

    if (parts.length === 0) {
      grid.innerHTML = '<p class="loading">No parts found.</p>';
      return;
    }

    grid.innerHTML = parts.map(part => `
      <div class="part-card">
        <img src="${part.pictureURL || ''}" alt="${part.description}"
             onerror="this.src='/img/placeholder.png'; this.onerror=null;" />
        <div class="part-name">${part.description}</div>
        <div class="part-price">$${parseFloat(part.price).toFixed(2)}</div>
        <div class="part-num">Part #${part.number}</div>
        <button onclick="addToCart(${JSON.stringify(part).replace(/"/g, '&quot;')})">
          Add to Cart
        </button>
      </div>
    `).join('');

  } catch (err) {
    grid.innerHTML = '<p class="error-msg">Could not connect to server.</p>';
  }
}

document.getElementById('search-btn').addEventListener('click', () => {
  const q = document.getElementById('search-input').value.trim();
  loadCatalog(q);
});

document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  loadCatalog();
});

document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('search-btn').click();
});

// --- Cart ---

function addToCart(part) {
  if (cart[part.number]) {
    cart[part.number].qty += 1;
  } else {
    cart[part.number] = { part, qty: 1 };
  }
  updateCartCount();
}

function updateCartCount() {
  const total = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  const items = Object.values(cart);

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    summary.classList.add('hidden');
    return;
  }

  container.innerHTML = items.map(({ part, qty }) => `
    <div class="cart-item">
      <div class="item-info">
        <div class="item-name">${part.description}</div>
        <div class="item-price">$${parseFloat(part.price).toFixed(2)} each</div>
      </div>
      <div class="qty-controls">
        <button onclick="changeQty(${part.number}, -1)">-</button>
        <span>${qty}</span>
        <button onclick="changeQty(${part.number}, 1)">+</button>
      </div>
      <button class="remove-btn" onclick="removeItem(${part.number})" title="Remove">×</button>
    </div>
  `).join('');

  const subtotal = items.reduce((sum, { part, qty }) => sum + part.price * qty, 0);
  const shipping = calcShipping(items);
  const total = subtotal + shipping;

  document.getElementById('subtotal').textContent = subtotal.toFixed(2);
  document.getElementById('shipping').textContent = shipping.toFixed(2);
  document.getElementById('total').textContent = total.toFixed(2);
  summary.classList.remove('hidden');
}

// Shipping is based on total weight — brackets match admin settings spec
function calcShipping(items) {
  const totalWeight = items.reduce((sum, { part, qty }) => sum + (part.weight || 0) * qty, 0);
  if (totalWeight <= 0) return 0;
  if (totalWeight <= 5) return 5.99;
  if (totalWeight <= 15) return 9.99;
  if (totalWeight <= 30) return 14.99;
  return 19.99;
}

function changeQty(partNumber, delta) {
  if (!cart[partNumber]) return;
  cart[partNumber].qty += delta;
  if (cart[partNumber].qty <= 0) delete cart[partNumber];
  updateCartCount();
  renderCart();
}

function removeItem(partNumber) {
  delete cart[partNumber];
  updateCartCount();
  renderCart();
}

document.getElementById('checkout-btn').addEventListener('click', () => {
  const customerName = document.getElementById('customer-name').value;
  //console.log(customerName);
  creditCardAuthorization('blank', '6011 1234 4321 1234', customerName, '12/2026', '654.32');
});

// Load catalog on startup
loadCatalog();
