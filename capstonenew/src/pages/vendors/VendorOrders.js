import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  VStack,
  Heading,
  Box,
  Text
} from '@chakra-ui/react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import OrderScanner from '../../Components/externalScanner';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const firestore = getFirestore();

  // Fetch orders with full details
  const fetchOrders = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('No user found');
      
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('shopId', '==', user.shopId));
      const snapshot = await getDocs(q);
      
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setOrders(ordersList.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Orders fetch error:', error);
    }
  }, [firestore]);

  // Initial orders fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6}>
        <Box width="full" p={6} borderWidth={1} borderRadius="lg" textAlign="center">
          <Heading mb={4} size="md">Order Pickup Scanner</Heading>
          
          <Text color="gray.600">
            Scanner active - Scan order IDs from anywhere
          </Text>
        </Box>
        
        {/* Add OrderScanner component */}
        <OrderScanner onOrderProcessed={fetchOrders} />
      </VStack>
    </Container>
  );
};

export default VendorOrders;