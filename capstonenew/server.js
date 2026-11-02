// const express = require('express');
// const crypto = require('crypto');
// const axios = require('axios');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// app.use(express.json());

// app.use(cors({
//     origin: [
//       'http://localhost:3003',  // Your React app's URL
//       'http://127.0.0.1:3000',
//       'https://your-production-domain.com'
//     ],
//     methods: ['GET', 'POST', 'OPTIONS'],
//     allowedHeaders: [
//       'Content-Type', 
//       'Authorization', 
//       'Access-Control-Allow-Origin',
//       'Access-Control-Allow-Methods',
//       'Access-Control-Allow-Headers'
//     ],
//     credentials: true
//   }));
  
//   app.use((req, res, next) => {
//     // Additional security headers
//     res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
//     res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
//     // Handle preflight requests
//     if (req.method === 'OPTIONS') {
//       return res.sendStatus(200);
//     }
    
//     next();
//   });
  
//   app.use(express.json());
//   app.use(express.urlencoded({ extended: true }));
  
//   // Logging middleware for debugging
//   app.use((req, res, next) => {
//     console.log(`Received ${req.method} request to ${req.path}`);
//     console.log('Headers:', req.headers);
//     console.log('Body:', req.body);
//     next();
//   });

// const PAYU_MERCHANT_KEY = 'gSR07M';
// const PAYU_SALT = 'RZdd32itbMYSKM7Kwo4teRkhUKCsWbnj';
// const PAYU_TEST_URL = 'https://secure.payu.in/_payment';
// const SUCCESS_URL = 'http://localhost:3003/payment-success';
// const FAILURE_URL = 'http://localhost:3003/payment-failure';

// function generateTransactionId() {
//   return 'TXN' + Date.now() + Math.random().toString(36).substring(2, 15);
// }

// function generateHash(payload) {
//   const { key, txnid, amount, productinfo, firstname, email } = payload;
//   const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;
//   return crypto.createHash('sha512').update(hashString).digest('hex');
// }

// app.post('/create-payment', async (req, res) => {
//   try {
//     const { amount, productinfo, firstname, email, phone } = req.body;
//     const txnid = generateTransactionId();

//     const payload = {
//       key: PAYU_MERCHANT_KEY,
//       txnid,
//       amount: parseFloat(amount).toFixed(2),
//       productinfo,
//       firstname,
//       email,
//       phone,
//       surl: SUCCESS_URL,
//       furl: FAILURE_URL
//     };

//     payload.hash = generateHash(payload);

//     const formData = new URLSearchParams(Object.entries(payload)).toString();

//     // For testing purposes, directly constructing the payment URL
//     const paymentUrl = `${PAYU_TEST_URL}?${formData}`;

//     res.json({
//       txnid,
//       paymentUrl,
//       message: 'Payment initiated successfully'
//     });
//   } catch (error) {
//     console.error('Payment initiation error:', error);
//     res.status(500).json({ message: 'Payment initiation failed', error: error.message });
//   }
// });

// app.post('/payment-response', (req, res) => {
//   const response = req.body;
  
//   // Verify hash for additional security
//   const receivedHash = response.hash;
//   const calculatedHash = generateHash(response);

//   if (receivedHash === calculatedHash && response.status === 'success') {
//     // Payment successful, update order status in your database
//     res.json({ status: 'success', message: 'Payment verified' });
//   } else {
//     res.json({ status: 'failure', message: 'Payment verification failed' });
//   }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`PayU Payment Server running on port ${PORT}`));

// module.exports = app;


const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true })); // Parse PayU's POST data

app.post('/payment-success', (req, res) => {
  // Log the payment details if needed
  console.log('Payment Response:', req.body);

  // Redirect the user to the home page
  res.redirect('https://www.thefost.com/');
});

app.listen(5001, () => {
  console.log('Server running on port 5000');
});
