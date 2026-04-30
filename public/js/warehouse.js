// warehouse page - pack orders, ship orders, log incoming inventory

let currentPackOrderId = null;

// tab switching
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(function(t) {
      t.classList.add('hidden');
    });
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');

    if (btn.dataset.tab === 'pack-tab') {
      loadPackOrders();
    }
    if (btn.dataset.tab === 'ship-tab') {
      loadShipOrders();
    }
  });
});

// --- pack orders ---

async function loadPackOrders() {
  const res = await fetch('/api/warehouse/pack');
  const orders = await res.json();

  const list = document.getElementById('pack-list');
  document.getElementById('pack-detail').classList.add('hidden');
  list.classList.remove('hidden');

  if (orders.length === 0) {
    list.innerHTML = '<p class="empty-msg">No orders ready to pack.</p>';
    return;
  }

  let html = '';
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const date = new Date(o.created_at).toLocaleDateString();
    html += '<div class="order-row" onclick="openPackOrder(' + o.id + ')">' +
      '<span>#' + o.id + '</span>' +
      '<span>' + o.customer_name + '</span>' +
      '<span>$' + parseFloat(o.total).toFixed(2) + '</span>' +
      '<span>' + date + '</span>' +
      '</div>';
  }
  list.innerHTML = html;
}

// show packing list for a specific order
async function openPackOrder(id) {
  const res = await fetch('/api/warehouse/pack/' + id);
  const order = await res.json();
  currentPackOrderId = id;

  document.getElementById('pack-list').classList.add('hidden');
  document.getElementById('pack-order-id').textContent = order.id;
  document.getElementById('pack-address').textContent = order.address;

  let rows = '';
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    rows += '<tr><td>' + item.description + '</td><td>' + item.part_number + '</td><td>' + item.qty + '</td></tr>';
  }
  document.getElementById('pack-items').innerHTML = rows;

  document.getElementById('pack-detail').classList.remove('hidden');
}

document.getElementById('back-to-pack-btn').addEventListener('click', function() {
  loadPackOrders();
});

document.getElementById('mark-packed-btn').addEventListener('click', async function() {
  if (!currentPackOrderId) return;

  const res = await fetch('/api/warehouse/pack/' + currentPackOrderId, { method: 'POST' });
  const data = await res.json();

  if (data.success) {
    alert('Order #' + currentPackOrderId + ' marked as packed.');
    loadPackOrders();
  } else {
    alert(data.error);
  }
});

// --- ship orders ---

async function loadShipOrders() {
  const res = await fetch('/api/warehouse/ship');
  const orders = await res.json();

  const list = document.getElementById('ship-list');

  if (orders.length === 0) {
    list.innerHTML = '<p class="empty-msg">No orders ready to ship.</p>';
    return;
  }

  let html = '';
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    html += '<div class="order-row">' +
      '<span>#' + o.id + '</span>' +
      '<span>' + o.customer_name + '</span>' +
      '<span>' + o.address + '</span>' +
      '<span>$' + parseFloat(o.total).toFixed(2) + '</span>' +
      '<button onclick="shipOrder(' + o.id + ')">Mark Shipped</button>' +
      '</div>';
  }
  list.innerHTML = html;
}

async function shipOrder(id) {
  if (!confirm('Mark order #' + id + ' as shipped?')) return;

  const res = await fetch('/api/warehouse/ship/' + id, { method: 'POST' });
  const data = await res.json();

  if (data.success) {
    alert('Order #' + id + ' marked as shipped. Customer emailed.');
    loadShipOrders();
  } else {
    alert(data.error);
  }
}

// --- receiving ---

document.getElementById('receiving-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const part_number = document.getElementById('recv-part').value;
  const qty = document.getElementById('recv-qty').value;
  const msg = document.getElementById('recv-msg');

  const res = await fetch('/api/warehouse/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_number: part_number, qty: parseInt(qty) }),
  });
  const data = await res.json();

  msg.classList.remove('hidden');

  if (data.success) {
    msg.textContent = 'Added ' + qty + ' units of part #' + part_number + ' to inventory.';
    msg.style.color = 'green';
    document.getElementById('recv-part').value = '';
    document.getElementById('recv-qty').value = '';
    loadInventory();
  } else {
    msg.textContent = data.error;
    msg.style.color = '#e94560';
  }
});

async function loadInventory() {
  const res = await fetch('/api/warehouse/inventory');
  const rows = await res.json();

  const list = document.getElementById('inventory-list');

  if (rows.length === 0) {
    list.innerHTML = '<p class="empty-msg">No inventory logged yet.</p>';
    return;
  }

  let html = '<table class="items-table"><thead><tr><th>Part #</th><th>Qty on Hand</th></tr></thead><tbody>';
  for (let i = 0; i < rows.length; i++) {
    html += '<tr><td>' + rows[i].part_number + '</td><td>' + rows[i].qty_on_hand + '</td></tr>';
  }
  html += '</tbody></table>';
  list.innerHTML = html;
}
