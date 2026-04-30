// main server - sets up express, routes, and the CC proxy

const express = require('express');
const path = require('path');
const http = require('http');

const catalogRoutes = require('./routes/catalog');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const warehouseRoutes = require('./routes/warehouse');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/catalog', catalogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/warehouse', warehouseRoutes);

// browser can't call NIU directly because of CORS, so we proxy it here server-side
app.post('/api/authorize', function(req, res) {
  const payload = JSON.stringify({
    vendor: 'Group 6A',
    trans: req.body.trans,
    cc: req.body.cc,
    name: req.body.name,
    exp: req.body.exp,
    amount: req.body.amount,
  });

  const options = {
    hostname: 'blitz.cs.niu.edu',
    path: '/CreditCard/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const request = http.request(options, function(response) {
    let data = '';
    response.on('data', function(chunk) {
      data += chunk;
    });
    response.on('end', function() {
      res.send(data);
    });
  });

  request.on('error', function(err) {
    console.error('CC proxy error:', err.message);
    res.status(502).send('Error: Could not reach payment processor.');
  });

  request.write(payload);
  request.end();
});

// everything else loads the SPA
app.get('/{*path}', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, function() {
  console.log('Server running at http://localhost:' + PORT);
});
