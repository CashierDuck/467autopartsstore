// main frontend logic - catalog, cart, checkout, page switching

const cart = {};
const PAGE_SIZE = 30;
let currentPage = 1;
let allParts = [];

// pages that require staff login
const PROTECTED_PAGES = ['admin', 'warehouse', 'receiving'];
let staffLoggedIn = false;
let pendingPage = null;
let pendingLink = null;

function showLoginModal(page, link) {
  pendingPage = page;
  pendingLink = link;
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('login-modal').classList.remove('hidden');
  document.getElementById('login-user').focus();
}

document.getElementById('login-submit-btn').addEventListener('click', function() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();

  if (user === 'admin1' && pass === 'aps123') {
    staffLoggedIn = true;
    document.getElementById('login-modal').classList.add('hidden');
    showPage(pendingPage);
    document.querySelectorAll('.nav-link').forEach(function(l) {
      l.classList.remove('active');
    });
    if (pendingLink) {
      pendingLink.classList.add('active');
    }
    pendingPage = null;
    pendingLink = null;
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
});

document.getElementById('login-cancel-btn').addEventListener('click', function() {
  document.getElementById('login-modal').classList.add('hidden');
  pendingPage = null;
  pendingLink = null;
});

document.getElementById('login-pass').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('login-submit-btn').click();
  }
});

// nav link click - check if page needs login first
document.querySelectorAll('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const page = link.dataset.page;

    if (PROTECTED_PAGES.includes(page) && !staffLoggedIn) {
      showLoginModal(page, link);
      return;
    }

    showPage(page);
    document.querySelectorAll('.nav-link').forEach(function(l) {
      l.classList.remove('active');
    });
    link.classList.add('active');
  });
});

function showPage(name) {
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });
  document.getElementById(name + '-page').classList.add('active');

  if (name === 'cart') {
    renderCart();
  }
  if (name === 'admin') {
    loadOrders();
    loadShippingRates();
  }
  if (name === 'warehouse') {
    loadPackOrders();
  }
  if (name === 'receiving') {
    loadInventory();
  }
}

// pull parts from the server, apply current sort, render first page
async function loadCatalog(query) {
  if (!query) query = '';

  const grid = document.getElementById('catalog-grid');
  grid.innerHTML = '<p class="loading">Loading...</p>';

  let url = '/api/catalog';
  if (query) {
    url = '/api/catalog/search?q=' + encodeURIComponent(query);
  }

  try {
    const res = await fetch(url);
    const parts = await res.json();

    if (!res.ok) {
      grid.innerHTML = '<p class="error-msg">' + (parts.error || 'Failed to load parts.') + '</p>';
      return;
    }

    if (parts.length === 0) {
      grid.innerHTML = '<p class="loading">No parts found.</p>';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    const sort = document.getElementById('sort-select').value;

    if (sort === 'price-asc') {
      parts.sort(function(a, b) { return a.price - b.price; });
    }
    if (sort === 'price-desc') {
      parts.sort(function(a, b) { return b.price - a.price; });
    }
    if (sort === 'name-asc') {
      parts.sort(function(a, b) { return a.description.localeCompare(b.description); });
    }
    if (sort === 'name-desc') {
      parts.sort(function(a, b) { return b.description.localeCompare(a.description); });
    }

    allParts = parts;
    currentPage = 1;
    renderPage();

  } catch (err) {
    grid.innerHTML = '<p class="error-msg">Could not connect to server.</p>';
  }
}

// slice allParts for the current page and build the grid + page buttons
function renderPage() {
  const grid = document.getElementById('catalog-grid');
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageParts = allParts.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(allParts.length / PAGE_SIZE);

  grid.innerHTML = pageParts.map(function(part) {
    return '<div class="part-card" onclick="openPartModal(' + JSON.stringify(part).replace(/"/g, '&quot;') + ')">' +
      '<img src="' + (part.pictureURL || '') + '" alt="' + part.description + '" onerror="this.src=\'/img/placeholder.png\'; this.onerror=null;" />' +
      '<div class="part-name">' + part.description + '</div>' +
      '<div class="part-price">$' + parseFloat(part.price).toFixed(2) + '</div>' +
      '<div class="part-num">Part #' + part.number + '</div>' +
      '<button onclick="event.stopPropagation(); addToCart(' + JSON.stringify(part).replace(/"/g, '&quot;') + ')">Add to Cart</button>' +
      '</div>';
  }).join('');

  const pag = document.getElementById('pagination');

  if (totalPages <= 1) {
    pag.innerHTML = '';
    return;
  }

  let pageButtons = '';
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      pageButtons += '<button onclick="goToPage(' + i + ')" class="page-active">' + i + '</button>';
    } else {
      pageButtons += '<button onclick="goToPage(' + i + ')">' + i + '</button>';
    }
  }

  let html = '';
  if (currentPage === 1) {
    html += '<button disabled>← Prev</button>';
  } else {
    html += '<button onclick="goToPage(' + (currentPage - 1) + ')">← Prev</button>';
  }
  html += pageButtons;
  if (currentPage === totalPages) {
    html += '<button disabled>Next →</button>';
  } else {
    html += '<button onclick="goToPage(' + (currentPage + 1) + ')">Next →</button>';
  }

  pag.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderPage();
  window.scrollTo(0, 0);
}

document.getElementById('search-btn').addEventListener('click', function() {
  const q = document.getElementById('search-input').value.trim();
  loadCatalog(q);
});

document.getElementById('clear-btn').addEventListener('click', function() {
  document.getElementById('search-input').value = '';
  loadCatalog();
});

document.getElementById('search-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('search-btn').click();
  }
});

// re-sort in memory, no need to hit the server again
document.getElementById('sort-select').addEventListener('change', function() {
  const sort = document.getElementById('sort-select').value;

  if (sort === 'price-asc') {
    allParts.sort(function(a, b) { return a.price - b.price; });
  }
  if (sort === 'price-desc') {
    allParts.sort(function(a, b) { return b.price - a.price; });
  }
  if (sort === 'name-asc') {
    allParts.sort(function(a, b) { return a.description.localeCompare(b.description); });
  }
  if (sort === 'name-desc') {
    allParts.sort(function(a, b) { return b.description.localeCompare(a.description); });
  }

  currentPage = 1;
  renderPage();
});

// --- cart ---

function addToCart(part) {
  if (cart[part.number]) {
    cart[part.number].qty += 1;
  } else {
    cart[part.number] = { part: part, qty: 1 };
  }
  updateCartCount();
}

function updateCartCount() {
  let total = 0;
  const items = Object.values(cart);
  for (let i = 0; i < items.length; i++) {
    total += items[i].qty;
  }
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

  let html = '';
  for (let i = 0; i < items.length; i++) {
    const part = items[i].part;
    const qty = items[i].qty;
    html += '<div class="cart-item">' +
      '<div class="item-info">' +
      '<div class="item-name">' + part.description + '</div>' +
      '<div class="item-price">$' + parseFloat(part.price).toFixed(2) + ' each</div>' +
      '</div>' +
      '<div class="qty-controls">' +
      '<button onclick="changeQty(' + part.number + ', -1)">-</button>' +
      '<span>' + qty + '</span>' +
      '<button onclick="changeQty(' + part.number + ', 1)">+</button>' +
      '</div>' +
      '<button class="remove-btn" onclick="removeItem(' + part.number + ')" title="Remove">×</button>' +
      '</div>';
  }
  container.innerHTML = html;

  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].part.price * items[i].qty;
  }
  const shipping = calcShipping(items);
  const total = subtotal + shipping;

  document.getElementById('subtotal').textContent = subtotal.toFixed(2);
  document.getElementById('shipping').textContent = shipping.toFixed(2);
  document.getElementById('total').textContent = total.toFixed(2);
  summary.classList.remove('hidden');
}

// weight brackets - match the shipping_rates table
function calcShipping(items) {
  let totalWeight = 0;
  for (let i = 0; i < items.length; i++) {
    totalWeight += (items[i].part.weight || 0) * items[i].qty;
  }

  if (totalWeight <= 0) return 0;
  if (totalWeight <= 5) return 5.99;
  if (totalWeight <= 15) return 9.99;
  if (totalWeight <= 30) return 14.99;
  return 19.99;
}

function changeQty(partNumber, delta) {
  if (!cart[partNumber]) return;
  cart[partNumber].qty += delta;
  if (cart[partNumber].qty <= 0) {
    delete cart[partNumber];
  }
  updateCartCount();
  renderCart();
}

function removeItem(partNumber) {
  delete cart[partNumber];
  updateCartCount();
  renderCart();
}

document.getElementById('checkout-btn').addEventListener('click', function() {
  populateCheckoutSummary();
  showPage('checkout');
  document.querySelectorAll('.nav-link').forEach(function(l) {
    l.classList.remove('active');
  });
});

document.getElementById('back-to-cart-btn').addEventListener('click', function() {
  showPage('cart');
  document.querySelector('[data-page="cart"]').classList.add('active');
});

document.getElementById('conf-continue-btn').addEventListener('click', function() {
  showPage('catalog');
  document.querySelector('[data-page="catalog"]').classList.add('active');
});

function populateCheckoutSummary() {
  const items = Object.values(cart);
  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].part.price * items[i].qty;
  }
  const shipping = calcShipping(items);
  document.getElementById('co-subtotal').textContent = subtotal.toFixed(2);
  document.getElementById('co-shipping').textContent = shipping.toFixed(2);
  document.getElementById('co-total').textContent = (subtotal + shipping).toFixed(2);
}

// auto-format card number as user types
document.getElementById('co-cc').addEventListener('input', function(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
});

// auto-format MM/YYYY
document.getElementById('co-exp').addEventListener('input', function(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 6);
  if (v.length > 2) {
    v = v.slice(0, 2) + '/' + v.slice(2);
  }
  e.target.value = v;
});

document.getElementById('checkout-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const errEl = document.getElementById('checkout-error');
  errEl.classList.add('hidden');

  const name = document.getElementById('co-name').value.trim();
  const email = document.getElementById('co-email').value.trim();
  const address = document.getElementById('co-address').value.trim();
  const cc = document.getElementById('co-cc').value.trim();
  const exp = document.getElementById('co-exp').value.trim();

  if (!name || !email || !address || !cc || !exp) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.classList.remove('hidden');
    return;
  }

  const cartItems = Object.values(cart);
  const items = [];
  for (let i = 0; i < cartItems.length; i++) {
    items.push({
      number: cartItems[i].part.number,
      description: cartItems[i].part.description,
      price: cartItems[i].part.price,
      weight: cartItems[i].part.weight,
      qty: cartItems[i].qty,
    });
  }

  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].price * items[i].qty;
  }
  const shipping = calcShipping(cartItems);
  const total = subtotal + shipping;

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    // unique transaction id for the NIU processor
    const transId = Date.now() + '-' + Math.floor(Math.random() * 1000000);
    const authResult = await creditCardAuthorization(transId, cc, name, exp, total.toFixed(2));

    // NIU returns a JSON object, not just a number - need to parse it
    let authCode = authResult;
    try {
      const parsed = JSON.parse(authResult);
      if (parsed.errors && parsed.errors.length > 0) {
        errEl.textContent = 'Payment declined: ' + parsed.errors.join(', ');
        errEl.classList.remove('hidden');
        return;
      }
      if (parsed.authorization) {
        authCode = String(parsed.authorization);
      }
    } catch (e) {
      // plain string, move on
    }

    if (!authCode || authCode.startsWith('Error')) {
      errEl.textContent = authCode || 'Payment declined. Please check your card details.';
      errEl.classList.remove('hidden');
      return;
    }

    // save the order to our db
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, address: address, cc: cc, exp: exp, items: items, authNumber: authCode }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Order failed. Please try again.';
      errEl.classList.remove('hidden');
      return;
    }

    // clear cart
    const keys = Object.keys(cart);
    for (let i = 0; i < keys.length; i++) {
      delete cart[keys[i]];
    }
    updateCartCount();

    document.getElementById('conf-order-id').textContent = data.orderId;
    document.getElementById('conf-total').textContent = data.total;
    document.getElementById('conf-auth').textContent = authCode;
    showPage('confirmation');
    document.querySelectorAll('.nav-link').forEach(function(l) {
      l.classList.remove('active');
    });

  } catch (err) {
    errEl.textContent = 'Could not connect to server. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
});

// --- part preview modal ---

let _modalPart = null;

function openPartModal(part) {
  _modalPart = part;
  document.getElementById('part-modal-img').src = part.pictureURL || '';
  document.getElementById('part-modal-img').onerror = function() {
    this.src = '/img/placeholder.png';
  };
  document.getElementById('part-modal-name').textContent = part.description;
  document.getElementById('part-modal-num').textContent = 'Part #' + part.number;
  document.getElementById('part-modal-price').textContent = '$' + parseFloat(part.price).toFixed(2);
  document.getElementById('part-modal').classList.remove('hidden');
}

document.getElementById('part-modal-close').addEventListener('click', function() {
  document.getElementById('part-modal').classList.add('hidden');
});

// close if clicking outside the box
document.getElementById('part-modal').addEventListener('click', function(e) {
  if (e.target === document.getElementById('part-modal')) {
    document.getElementById('part-modal').classList.add('hidden');
  }
});

document.getElementById('part-modal-add').addEventListener('click', function() {
  if (_modalPart) {
    addToCart(_modalPart);
  }
  document.getElementById('part-modal').classList.add('hidden');
});

// hamburger menu
document.querySelector('.menu-btn').addEventListener('click', function(e) {
  e.stopPropagation();
  document.querySelector('.menu-items').classList.toggle('hidden');
});

document.addEventListener('click', function() {
  document.querySelector('.menu-items').classList.add('hidden');
});

loadCatalog();
