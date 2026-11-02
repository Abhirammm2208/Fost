const express = require('express');
const app = express();
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
require('dotenv').config();
const CryptoJS = require('crypto-js');




// Initialize Firebase Admin
const serviceAccountConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountConfig)
});

const cors = require('cors');
app.use(cors({
  origin: ['https://www.thefost.com', 'https://thefost.com', 'http://localhost:5000','http://localhost:5058','https://fosterman.click','https://fosterman.in','https://backend.fosterman.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const updateUserPoints = async (userId, pointsToAdd) => {
  const firestore = admin.firestore();
  const userRef = firestore.collection('users').doc(userId);

  try {
    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        // Create new user document if it doesn't exist
        transaction.set(userRef, {
          points: pointsToAdd,
          role: 'customer',
          email: '', // Will be updated when available
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          shopId: null
        });
      } else {
        // Update existing user document
        const currentPoints = userDoc.data().points || 0;
        transaction.update(userRef, {
          points: currentPoints + pointsToAdd,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    console.log(`Successfully updated points for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating user points:', error);
    return false;
  }
};

// Additional function to update user email if needed
const updateUserEmail = async (userId, email) => {
  const firestore = admin.firestore();
  const userRef = firestore.collection('users').doc(userId);

  try {
    await userRef.update({
      email: email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user email:', error);
    return false;
  }
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// PayU webhook verification middleware
const verifyPayUWebhook = (req, res, next) => {
  try {
    console.log('Verifying PayU webhook signature');
    const { hash, key, txnid, status, amount } = req.body;
    const PAYU_SALT_KEY = process.env.PAYU_SALT_KEY;
    
    const hashString = `${PAYU_SALT_KEY}|${status}||||||||||${amount}|${txnid}|${key}`;
    const calculatedHash = CryptoJS.SHA512(hashString).toString();
    
    if (hash === calculatedHash) {
      console.log('PayU webhook signature verified successfully');
      next();
    } else {
      console.error('Invalid PayU webhook signature');
      res.status(401).json({ error: 'Invalid webhook signature' });
    }
  } catch (error) {
    console.error('Error verifying PayU webhook:', error);
    res.status(400).json({ error: 'Invalid webhook data' });
  }
};

// Helper function to process order creation
const createOrder = async (transactionData, paymentDetails = null, processType = 'webhook') => {
  const firestore = admin.firestore();
  const orderRef = firestore.collection('orders').doc();
  const orderPoints = calculateOrderPoints(transactionData.items);

  console.log('Transaction Data Items:', transactionData.items);
  console.log('Calculated Order Points:', orderPoints);

  try {
    await firestore.runTransaction(async (transaction) => {
      // Check for existing order with same transaction ID
      const existingOrdersQuery = await transaction.get(
        firestore.collection('orders')
          .where('txnid', '==', transactionData.txnid)
      );

      // Validate conditions
      if (!existingOrdersQuery.empty) {
        throw new Error('Order already exists for this transaction');
      }

      // Prepare order data
      const orderData = {
        ...transactionData,
        status: 'pending',
        paymentStatus: 'completed',
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        processType: processType,
        points: orderPoints,
        ...(paymentDetails && { paymentDetails })
      };

      // Create the order
      transaction.set(orderRef, orderData);
    });

    // After successful order creation, update user points
    if (transactionData.userId && orderPoints > 0) {
      // Update points and create user if doesn't exist
      const pointsUpdated = await updateUserPoints(transactionData.userId, orderPoints);
      
      // If points were updated successfully and we have an email, update it
      if (pointsUpdated && transactionData.customerEmail) {
        await updateUserEmail(transactionData.userId, transactionData.customerEmail);
      }
    }

    // Send confirmation email
    await sendOrderConfirmationEmail(orderRef.id, {
      ...transactionData,
      earnedPoints: orderPoints,
      total: transactionData.total
    });

    return orderRef.id;
  } catch (error) {
    console.error('Error creating order and updating points:', error);
    throw error;
  }
};

// Helper function to calculate order points (unchanged)
const calculateOrderPoints = (items) => {
  return items.reduce((total, item) => total + (item.point || 0) * item.quantity, 0);
};

// Initiate Payment Route
app.post('/initiate-payment', async (req, res) => {
  try {
    const { shopData, userData } = req.body;
    console.log('Starting payment initiation');

    // Validate required data
    if (!shopData || !userData || !shopData.total || !userData.email) {
      return res.status(400).json({ 
        error: 'Missing required payment data',
        message: 'Shop data and user data are required' 
      });
    }

    const txnid = `TXN_${Date.now()}`;
    const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
    const PAYU_SALT_KEY = process.env.PAYU_SALT_KEY;
    
    // Create transaction data
    const transactionData = {
      shopId: shopData.shopId,
      ...(shopData.vendorId && { vendorId: shopData.vendorId }),
      userId: userData.uid,
      shopName: shopData.shopName,
      items: shopData.items?.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        dietType: item.dietType,
        imageUrl: item.imageUrl,
        point: item.point
      })) || [],
      total: parseFloat(shopData.total),
      status: 'pending',
      paymentStatus: 'pending',
      customerEmail: userData.email,
      firstname: userData.displayName || 'Customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      txnid: txnid
    };

    // Save transaction to Firestore
    await admin.firestore()
      .collection('transactions')
      .add(transactionData);

    // Prepare PayU payment parameters
    const paymentParams = {
      key: PAYU_MERCHANT_KEY,
      txnid: txnid,
      amount: shopData.total.toFixed(2),
      productinfo: `Order from ${shopData.shopName}`,
      firstname: userData.displayName || 'Customer',
      email: userData.email,
      phone: userData.phoneNumber || '',
      surl: `http://localhost:5058/payment-success?transactionId=${txnid}`,
      furl: `https://thefost.com/error`,
    };

    // Generate hash
    const hashString = `${paymentParams.key}|${paymentParams.txnid}|${paymentParams.amount}|${paymentParams.productinfo}|${paymentParams.firstname}|${paymentParams.email}|||||||||||${PAYU_SALT_KEY}`;
    const hash = CryptoJS.SHA512(hashString).toString();
    
    res.json({
      ...paymentParams,
      hash: hash,
      payuBaseUrl: process.env.PAYU_BASE_URL || 'https://secure.payu.in/_payment'
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      error: 'Failed to initiate payment',
      message: error.message
    });
  }
});

// PayU Webhook Handler
// app.post('/payu-webhook', async (req, res) => {
//   try {
//     console.log('Received PayU webhook:', JSON.stringify(req.body, null, 2));
//     const { txnid, status, amount } = req.body;
    
//     const firestore = admin.firestore();

//     // Check for existing order
//     const existingOrderSnapshot = await firestore
//       .collection('orders')
//       .where('txnid', '==', txnid)
//       .get();

//     if (!existingOrderSnapshot.empty) {
//       console.log('Order already exists for transaction:', txnid);
//       return res.status(200).json({ message: 'Order already processed' });
//     }

//     // Process the webhook with points handling
//     await firestore.runTransaction(async (transaction) => {
//       const transactionQuery = await transaction.get(
//         firestore.collection('transactions').where('txnid', '==', txnid)
//       );
      
//       if (transactionQuery.empty) {
//         throw new Error('Transaction not found');
//       }

//       const transactionDoc = transactionQuery.docs[0];
//       const transactionData = transactionDoc.data();
      
//       if (status.toLowerCase() === 'success') {
//         // Create order and process points
//         await createOrder(transactionData, req.body, 'webhook');

//         // Update transaction
//         await transaction.update(transactionDoc.ref, {
//           status: 'completed',
//           paymentStatus: 'success',
//           webhookProcessed: true,
//           updatedAt: admin.firestore.FieldValue.serverTimestamp()
//         });
//       } else {
//         // Handle failed payment
//         await transaction.update(transactionDoc.ref, {
//           status: 'failed',
//           paymentStatus: 'failed',
//           failureReason: req.body.error_Message || 'Payment failed',
//           webhookProcessed: true,
//           updatedAt: admin.firestore.FieldValue.serverTimestamp()
//         });
//       }
//     });

//     res.status(200).json({ message: 'Webhook processed successfully' });
//   } catch (error) {
//     console.error('Webhook processing error:', error);
//     res.status(500).json({ error: 'Webhook processing failed' });
//   }
// });

app.post('/sendnotification', async (req, res) => {
  try {
    const { orderId, customerEmail, shopName, customerName, items } = req.body;

    if (!orderId || !customerEmail || !shopName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'orderId, customerEmail, and shopName are required'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Your Order #${orderId.slice(-6)} from ${shopName} is Ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A5568;">Order Ready for Pickup</h1>
          </div>
          
          <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;">Hi ${customerName || 'Valued Customer'},</p>
            <p>Great news! Your order is now ready for pickup at ${shopName}.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #4A5568; font-size: 18px;">Order Details:</h2>
            <p style="margin: 5px 0;">Order Number: #${orderId.slice(-6)}</p>
            <p style="margin: 5px 0;">Restaurant/Store: ${shopName}</p>
          </div>
          
          ${Array.isArray(items) ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #4A5568; font-size: 16px;">Items in your order:</h3>
              <ul style="list-style: none; padding: 0;">
                ${items.map(item => `
                  <li style="padding: 10px; background-color: #F7FAFC; margin-bottom: 5px; border-radius: 4px;">
                    ${item}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="background-color: #F7FAFC; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; text-align: center; color: #2D3748;">
              Please show your order QR code when picking up your order.
            </p>
          </div>

          <div style="text-align: center; color: #718096; font-size: 14px;">
            <p>Thank you for choosing ${shopName}!</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Order ready notification email sent successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Notification email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending notification email:', error);
    res.status(500).json({ 
      error: 'Failed to send notification email',
      message: error.message 
    });
  }
});

// Payment Success Route
app.post('/payment-success', async (req, res) => {
  try {
    const { transactionId } = req.query;
    console.log('Processing payment success for transaction:', transactionId);
    
    if (!transactionId) {
      console.error('Missing transaction ID in success callback');
      return res.redirect('https://fosterman.in/payment-failure');
    }

    const firestore = admin.firestore();
    
    // Find the transaction
    const transactionSnapshot = await firestore
      .collection('transactions')
      .where('txnid', '==', transactionId)
      .get();

    if (transactionSnapshot.empty) {
      console.error('Transaction not found:', transactionId);
      return res.redirect('https://fosterman.in/payment-failure');
    }

    const transactionDoc = transactionSnapshot.docs[0];
    const transactionData = transactionDoc.data();

    // Check if webhook has already processed this transaction
    if (transactionData.webhookProcessed) {
      console.log('Transaction already processed by webhook');
      const orderSnapshot = await firestore
        .collection('orders')
        .where('txnid', '==', transactionId)
        .get();
      
      if (!orderSnapshot.empty) {
        return res.redirect(`http://localhost:5000/order-waiting/${orderSnapshot.docs[0].id}`);
      }
    }

    // If webhook hasn't processed it yet, handle it here
    const orderSnapshot = await firestore
      .collection('orders')
      .where('txnid', '==', transactionId)
      .get();

    let orderId;

    try {
      if (orderSnapshot.empty) {
        // Create new order
        orderId = await createOrder(transactionData, null, 'redirect');

        // Update transaction
        await transactionDoc.ref.update({
          status: 'completed',
          paymentStatus: 'success',
          manuallyProcessed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        orderId = orderSnapshot.docs[0].id;
      }

      // Redirect to order waiting page
      return res.redirect(`https://localhost:5000/order-waiting/${orderId}`);
    } catch (orderError) {
      console.error('Error processing order:', orderError);
      // Update transaction with error status
      await transactionDoc.ref.update({
        status: 'failed',
        paymentStatus: 'failed',
        error: orderError.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.redirect('https://fosterman.in/payment-failure');
    }
  } catch (error) {
    console.error('Error processing payment success:', error);
    return res.redirect('https://fosterman.in/payment-failure');
  }
});

// Add a new route for payment failure
app.get('/payment-failure', (req, res) => {
  // Redirect to the frontend payment failure page
  res.redirect('https://fosterman.in/payment-failure');
});

// PayU Webhook Handler (updated with better error handling)
app.post('/payu-webhook', async (req, res) => {
  try {
    console.log('Received PayU webhook:', JSON.stringify(req.body, null, 2));
    const { txnid, status, amount } = req.body;
    
    if (!txnid || !status) {
      console.error('Missing required webhook parameters');
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const firestore = admin.firestore();

    // Check for existing order
    const existingOrderSnapshot = await firestore
      .collection('orders')
      .where('txnid', '==', txnid)
      .get();

    if (!existingOrderSnapshot.empty) {
      console.log('Order already exists for transaction:', txnid);
      return res.status(200).json({ message: 'Order already processed' });
    }

    // Process the webhook with points handling
    await firestore.runTransaction(async (transaction) => {
      const transactionQuery = await transaction.get(
        firestore.collection('transactions').where('txnid', '==', txnid)
      );
      
      if (transactionQuery.empty) {
        throw new Error('Transaction not found');
      }

      const transactionDoc = transactionQuery.docs[0];
      const transactionData = transactionDoc.data();
      
      if (status.toLowerCase() === 'success') {
        // Create order and process points
        await createOrder(transactionData, req.body, 'webhook');

        // Update transaction
        await transaction.update(transactionDoc.ref, {
          status: 'completed',
          paymentStatus: 'success',
          webhookProcessed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Handle failed payment
        await transaction.update(transactionDoc.ref, {
          status: 'failed',
          paymentStatus: 'failed',
          failureReason: req.body.error_Message || 'Payment failed',
          webhookProcessed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
});

// Helper function to send order confirmation email
const sendOrderConfirmationEmail = async (orderId, orderData) => {
  const formatDate = (date) => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: orderData.customerEmail,
    subject: `Order Confirmation - ${orderData.shopName} - Order #${orderId.slice(-6)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header with Logo -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px;">
          <h1 style="color: #2D3748; margin: 0;">Order Confirmation</h1>
          <p style="color: #718096; margin: 10px 0 0;">Thank you for your order!</p>
        </div>

        <!-- Order Summary -->
        <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2D3748; margin: 0 0 15px; font-size: 18px;">Order Summary</h2>
          <p style="margin: 5px 0; color: #4A5568;">Order Number: #${orderId.slice(-6)}</p>
          <p style="margin: 5px 0; color: #4A5568;">Date: ${formatDate(new Date())}</p>
          <p style="margin: 5px 0; color: #4A5568;">Restaurant/Store: ${orderData.shopName}</p>
        </div>

        <!-- Order Details -->
        <div style="margin-bottom: 20px;">
          <h2 style="color: #2D3748; margin: 0 0 15px; font-size: 18px;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #F7FAFC;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #E2E8F0;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #E2E8F0;">Quantity</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #E2E8F0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">
                    <div style="font-weight: 500;">${item.name}</div>
                    ${item.dietType ? `<div style="color: #718096; font-size: 14px;">${item.dietType}</div>` : ''}
                  </td>
                  <td style="padding: 12px; text-align: center; border-bottom: 1px solid #E2E8F0;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #F7FAFC;">
                <td colspan="2" style="padding: 12px; font-weight: bold;">Total Amount</td>
                <td style="padding: 12px; text-align: right; font-weight: bold;">₹${orderData.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Points Earned -->
        ${orderData.earnedPoints ? `
        <div style="background-color: #F0FFF4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #C6F6D5;">
          <p style="margin: 0; color: #2F855A; font-size: 16px; font-weight: 500;">
            <span style="font-size: 18px;">🎉</span> Congratulations! You earned ${orderData.earnedPoints} health points with this order!
          </p>
        </div>
        ` : ''}

        <!-- Pickup Instructions -->
        <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2D3748; margin: 0 0 15px; font-size: 18px;">Pickup Instructions</h2>
          <p style="margin: 0 0 10px; color: #4A5568;">1. Please show your order QR code when picking up your order.</p>
          <p style="margin: 0 0 10px; color: #4A5568;">2. We'll notify you when your order is ready for pickup.</p>
          <p style="margin: 0; color: #4A5568;">3. If you have any questions, please contact the restaurant directly.</p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #718096; font-size: 14px; border-top: 2px solid #E2E8F0; padding-top: 20px;">
          <p style="margin: 0 0 10px;">Thank you for choosing ${orderData.shopName}!</p>
          <p style="margin: 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 5058;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;