const http = require('http');
const data = JSON.stringify({
  items: [{ id: '6a0f76aa5c37c47f24302111', qty: 1, rate: 90, price: 90, name: 'Mango Lassi (V)', taxStatus: 'With Tax', gst: 5 }],
  subtotal: 90, total: 94.50, paymentMode: "Cash", paymentStatus: "Paid",
  profileId: '6a26c6aa5c37c47f24302143'
});
const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/bill-manager', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, (res) => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => console.log("Response:", Buffer.concat(chunks).toString()));
});
req.write(data);
req.end();
