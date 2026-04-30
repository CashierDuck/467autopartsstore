# CS 467 Auto Parts Store — Project Summary

---

## What This Is

An online auto parts store built for CS 467 (Group 6A) at NIU. Customers can browse a parts catalog, add items to a cart, and place orders with real credit card authorization. There's also an admin panel to manage orders and shipping rates, a warehouse interface for packing and shipping, and a receiving desk for logging new inventory.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Frontend | Vanilla HTML, CSS, JavaScript (no frameworks) |
| Customer/Order DB | MySQL (hosted on Railway) |
| Parts Catalog DB | MySQL (hosted at NIU — blitz.cs.niu.edu) |
| Deployment | Render (https://four67autopartsstore.onrender.com) |
| Email | Gmail via Nodemailer |
| Version Control | Git + GitHub |

---

## Features Built

### Customer-Facing
- **Browse Catalog** — loads all parts from the NIU legacy database, shows image, name, price, part number
- **Search** — filter parts by keyword in real time
- **Sort** — sort by price (low/high) or name (A–Z, Z–A)
- **Pagination** — 30 parts per page with numbered page buttons
- **Part Preview** — click any part card to see an enlarged image and details in a modal
- **Shopping Cart** — add/remove items, adjust quantities, calculates subtotal + shipping by weight
- **Checkout** — form for name, email, shipping address, card number, expiry date
- **Credit Card Authorization** — sends card to NIU processor, gets back authorization number
- **Order Confirmation** — shows order number and auth code, sends confirmation email to customer

### Admin Panel
- **Manage Orders** — view all orders, filter by status/date/price range
- **Order Detail** — click any order to see full details and line items
- **Cancel Orders** — can cancel orders that haven't shipped yet
- **Shipping Rates** — edit weight brackets and fees directly in the UI

### Warehouse
- **Pack Orders** — shows authorized orders ready to pack, view packing list, mark as packed
- **Ship Orders** — shows packed orders, mark as shipped, emails customer shipping confirmation
- **Load Inventory** — receiving desk logs incoming stock by part number and quantity
- **View Inventory** — see current stock counts for all parts

---

## Servers & Databases

### Render (App Server)
- Hosts the Node.js/Express app
- URL: https://four67autopartsstore.onrender.com
- Free tier — spins down after inactivity, takes ~30 seconds to wake up
- Pulls code directly from GitHub (auto-deploys on push to master)

### Railway (Order Database)
- Hosted MySQL database
- Host: switchback.proxy.rlwy.net, Port: 53809
- Database name: railway
- Tables:
  - `orders` — customer info, totals, auth number, status, timestamp
  - `order_items` — line items per order (part number, description, price, qty, weight)
  - `shipping_rates` — weight brackets and fees (editable by admin)
  - `inventory` — qty on hand per part number

### NIU Legacy Database (blitz.cs.niu.edu)
- Read-only MySQL database maintained by NIU
- Contains the parts catalog: number, description, price, weight, pictureURL
- Requires SSL connection from outside the NIU network

### NIU Credit Card Processor (blitz.cs.niu.edu/CreditCard/)
- External REST API — accepts POST with card number, expiry, amount, name, vendor ID, transaction ID
- Returns a JSON object with an authorization number on success, or an errors array on failure
- Vendor ID: "Group 6A"
- Called server-side (proxied through /api/authorize) because browsers block direct calls due to CORS

---

## How Everything Is Connected

```
Browser
  |
  |-- GET /api/catalog          --> routes/catalog.js --> NIU legacy DB (parts)
  |-- POST /api/authorize       --> server.js proxy   --> NIU CC processor
  |-- POST /api/orders          --> routes/orders.js  --> Railway DB (save order) + Gmail (email)
  |-- GET/POST /api/admin/*     --> routes/admin.js   --> Railway DB (orders, shipping rates)
  |-- GET/POST /api/warehouse/* --> routes/warehouse.js --> Railway DB (orders, inventory) + Gmail
```

### Frontend Files
- `public/index.html` — all pages in one HTML file, shown/hidden via JS
- `public/js/app.js` — catalog, cart, checkout, pagination, part modal
- `public/js/cc-authorization.js` — calls /api/authorize and returns the result
- `public/js/admin.js` — admin orders list, filters, order modal, shipping rate editor
- `public/js/warehouse.js` — pack/ship queue, receiving form, inventory table
- `public/css/style.css` — all styles

### Backend Files
- `server.js` — Express setup, static files, CC proxy route
- `db.js` — connection pool to NIU legacy database
- `localdb.js` — connection pool to Railway database
- `routes/catalog.js` — GET /api/catalog and /api/catalog/search
- `routes/orders.js` — POST /api/orders (save order + send email)
- `routes/admin.js` — order management and shipping rate endpoints
- `routes/warehouse.js` — pack, ship, inventory endpoints

---

## Complications

- **CORS** — the browser can't call the NIU credit card processor directly. Had to proxy the request through the Express server so it goes server-to-server instead.
- **CC response format** — the NIU processor returns a full JSON object, not just an auth number. Had to parse out the `authorization` field and check for an `errors` array to detect declined cards.
- **Railway setup** — no MySQL client locally, so the schema had to be created using Railway's built-in query editor in the browser.
- **Auth number column too short** — originally VARCHAR(100), but the full JSON response from NIU was longer. Fixed with ALTER TABLE to VARCHAR(500), then parsed just the auth number for display.
- **Render deployment** — environment variables for the Railway DB had to be added manually in Render's dashboard so credentials weren't hardcoded in the deployed code.
- **Gmail email** — nodemailer requires a Gmail App Password (not your real password) because Google blocks direct login from apps.

---

## Algorithms / Logic

- **Shipping calculation** — looks up the fee from the `shipping_rates` table by finding the lowest `max_weight` bracket that is >= the order's total weight. Defaults to $19.99 if nothing matches.
- **Pagination** — all parts are loaded once into memory, then sliced client-side by page number (30 per page). Sorting re-sorts the in-memory array and resets to page 1.
- **Sorting** — client-side sort on the loaded parts array using `.sort()` with comparators for price (numeric) and name (localeCompare).
- **Cart** — stored as a plain JS object keyed by part number `{ partNumber: { part, qty } }`. Lives in memory only — refreshing the page clears it.
- **Transaction ID** — generated as `${Date.now()}-${random}` to ensure uniqueness per CC authorization request.
- **Order status flow** — `authorized` → `packed` → `shipped` (or `cancelled` from `authorized` only). Each transition is validated server-side before the update runs.

---

## Why I Built This

This is a CS 467 capstone group project at NIU. The goal was to build a full-stack e-commerce system that integrates with two external systems — a legacy parts database and a credit card processor — both maintained by the university. The project covers the full order lifecycle from browsing to shipping.

---

## Time Estimate

| Feature | Est. Time |
|---|---|
| Browse Catalog (Case 1) | ~3 hrs |
| Place Order + CC Auth (Case 2) | ~5 hrs |
| Railway DB setup + deployment | ~2 hrs |
| Manage Orders / Admin Settings (Case 3-4) | ~3 hrs |
| Pack Orders / Ship Orders (Case 5-6) | ~2 hrs |
| Load Inventory (Case 7) | ~1 hr |
| UI redesign, pagination, modals | ~3 hrs |
| Debugging (CORS, auth number, DB column) | ~2 hrs |
| **Total** | **~21 hrs** |

---

*Live site: https://four67autopartsstore.onrender.com*
*GitHub: https://github.com/CashierDuck/467autopartsstore*
