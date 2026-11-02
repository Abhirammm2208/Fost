import React, { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { useToast } from '@chakra-ui/react';

const OrderScanner = ({ onOrderProcessed }) => {
  const [scannedOrderId, setScannedOrderId] = useState('');
  const firestore = getFirestore();
  const toast = useToast();

  // Process scanned order
  const processScannedOrder = async (orderId) => {
    if (!orderId) return;

    console.log('Processing Order ID:', orderId);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const orderRef = doc(firestore, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        console.error(`Order not found: ${orderId}`);
        toast({
          title: 'Order Not Found',
          description: `No order with ID: ${orderId}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const orderData = orderDoc.data();
      
      // Verify order belongs to current shop
      if (orderData.shopId !== user.shopId) {
        console.warn(`Order ${orderId} does not belong to this shop`);
        toast({
          title: 'Invalid Order',
          description: 'Order does not belong to your shop',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Update order status
      await updateDoc(orderRef, { 
        status: 'picked_up', 
        pickedUpAt: new Date() 
      });

      // Trigger parent component's order refresh if callback provided
      if (onOrderProcessed) {
        onOrderProcessed(orderId);
      }

      toast({
        title: 'Order Picked Up',
        description: `Order ${orderId} processed successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Order processing error:', error);
      toast({
        title: 'Processing Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Global scanner listener
  useEffect(() => {
    let scannedId = '';
    let scanTimeout;

    const handleKeyPress = (event) => {
      // Capture all keypress events system-wide
      clearTimeout(scanTimeout);

      // Build scanned ID
      if (event.key !== 'Enter') {
        scannedId += event.key;
      }

      // Process on Enter or after short delay
      scanTimeout = setTimeout(() => {
        if (scannedId.trim()) {
          processScannedOrder(scannedId.trim());
          scannedId = ''; // Reset
        }
      }, 100); // Short delay to capture full ID
    };

    // Add system-wide event listener
    window.addEventListener('keypress', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(scanTimeout);
    };
  }, []);

  return null; // This is a headless component
};

export default OrderScanner;