const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(
  'description String?  // e.g., "Order #123" or "Manual Deposit"',
  'description String?  // e.g., "Order #123" or "Manual Deposit"\n  paymentProof String?'
);
fs.writeFileSync('prisma/schema.prisma', schema);
