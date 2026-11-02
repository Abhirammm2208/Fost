import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Box,
  Text,
  Flex,
  Badge,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import OrderDetailsModal from '../utils/orderDetailsModel';
import { 
  AiOutlineClockCircle, 
  AiOutlineCheckCircle, 
  AiOutlineSearch,
  AiOutlinePlayCircle,
  AiOutlineDown,
  AiOutlineUp,
  AiOutlineStop,
  AiOutlineFire
} from 'react-icons/ai';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

// Keep existing calculation functions
const calculatePrepTime = (items) => {
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  return 2 + totalItems;
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'express': return 'green';
    case 'standard': return 'blue';
    case 'complex': return 'orange';
    default: return 'gray';
  }
};

const calculateOrderPriority = (order) => {
  const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const waitTime = (new Date() - order.createdAt) / (1000 * 60);
  
  let category;
  if (totalItems <= 2) {
    category = 'express';
  } else if (totalItems <= 5) {
    category = 'standard';
  } else {
    category = 'complex';
  }

  let priorityScore = totalItems;
  if (waitTime > 15) {
    priorityScore -= (waitTime / 15);
  }

  return {
    category,
    totalItems,
    priorityScore,
    estimatedPrepTime: calculatePrepTime(order.items),
    waitTime: Math.round(waitTime)
  };
};



const QRScannerModal = ({ isOpen, onClose, order, onScanComplete }) => {
  const handleQRScan = async (result) => {
    try {
      const scannedValue = result[0]?.rawValue;
      const expectedValue = `${order.id}`;
      
      if (scannedValue === expectedValue) {
        await onScanComplete(order.id);
        onClose();
      }
    } catch (error) {
      console.error('QR scan error:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Scan QR Code for Order #{order?.id.slice(-6)}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Scanner
            onScan={handleQRScan}
            onError={(error) => console.error(error?.message)}
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const VendorOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [qrScannerModal, setQRScannerModal] = useState({ isOpen: false, order: null });
  const [lastScannedOrderId, setLastScannedOrderId] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [scannedOrderModal, setScannedOrderModal] = useState({ isOpen: false, order: null });
  const [scannerKey, setScannerKey] = useState(0);
  const [scannerError, setScannerError] = useState(null);
  const toast = useToast();
  const firestore = getFirestore();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('Current user from localStorage:', user); // Debug user info
  
      if (!user || !user.shopId) {
        console.error('No user or shopId found in localStorage');
        throw new Error('Shop ID not found. Please login again.');
      }
  
      console.log('Attempting to fetch orders for shopId:', user.shopId);
      
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef);  // Temporarily remove filter to see ALL orders
      
      console.log('Executing Firestore query...');
      const snapshot = await getDocs(q);
      console.log('Total documents found:', snapshot.size);
      
      // Log all orders before filtering
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('Raw order data:', {
          id: doc.id,
          shopId: data.shopId,
          status: data.status,
          customerEmail: data.customerEmail || data.customer?.email,
          total: data.totalAmount || data.total
        });
      });
  
      // Now filter manually to see what's being excluded
      const allOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
          items: Array.isArray(data.items) ? data.items : [],
          total: data.totalAmount || data.total || 0,
          customer: {
            email: data.customerEmail || data.customer?.email,
            id: data.customerId || data.customer?.id || data.userId,
            name: data.customerName || data.customer?.name
          }
        };
      });
  
      console.log('All orders before shopId filter:', allOrders.length);
      
      const filteredOrders = allOrders.filter(order => {
        const matches = order.shopId === user.shopId;
        if (!matches) {
          console.log('Order excluded:', {
            orderId: order.id,
            orderShopId: order.shopId,
            userShopId: user.shopId
          });
        }
        return matches;
      });
  
      console.log('Orders after shopId filter:', filteredOrders.length);
      
      const sortedOrders = filteredOrders.sort((a, b) => b.createdAt - a.createdAt);
      
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
      setLastUpdateTime(new Date());
  
      // Log final processed orders
      console.log('Final processed orders:', sortedOrders.map(order => ({
        id: order.id,
        status: order.status,
        customerEmail: order.customer.email,
        total: order.total,
        createdAt: order.createdAt
      })));
  
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      const orderSnapshot = await getDoc(orderRef);
      const orderData = orderSnapshot.data();
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      if (newStatus === 'completed') {
        try {
          // Log the entire orderData for debugging
          console.log('Full Order Data:', orderData);
      
          // Multiple strategies to extract email
          const customerEmail = 
            orderData.customer?.email || 
            orderData.email || 
            orderData.customerEmail || 
            orderData.user?.email;
      
          if (!customerEmail) {
            // If no email is found, throw a detailed error
            console.error('No email fields found in order data:', Object.keys(orderData));
            throw new Error('Customer email could not be found. Please check order details.');
          }
      
          // Prepare notification payload
          const notificationPayload = {
            orderId: orderId,
            customerEmail: customerEmail,
            shopName: orderData.shopName || 'Our Shop',
            customerName: orderData.customer?.name || orderData.name || 'Customer',
            items: orderData.items?.map(item => `${item.quantity} x ${item.name}`).join(', ') || 'No items',
          };
      
          console.log('Notification Payload:', notificationPayload);
      
          await axios.post('https://fostservernew.onrender.com/sendnotification', notificationPayload);
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
          toast({
            title: 'Notification Error',
            description: notificationError.message,
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      }
      
      await fetchOrders();
      
      toast({
        title: 'Order Updated',
        description: `Order status changed to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleScanQR = (order) => {
    setQRScannerModal({
      isOpen: true,
      order: order
    });
  };

  const handleQRScanComplete = async (orderId) => {
    try {
      await updateDoc(doc(firestore, 'orders', orderId), {
        status: 'picked_up',
        pickedUpAt: new Date()
      });

      setLastScannedOrderId(orderId);
      await fetchOrders();

      toast({
        title: 'Order Picked Up',
        description: 'Order has been successfully picked up',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to complete order pickup:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete order pickup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = orders;

    if (searchTerm) {
      result = result.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(order => 
        calculateOrderPriority(order).category === categoryFilter
      );
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, categoryFilter]);

  const handlePersistentQRScan = async (result) => {
    try {
      // Ensure orders are loaded before scanning
      if (orders.length === 0) {
        await fetchOrders();
      }
  
      const scannedValue = result[0]?.rawValue;
      const expectedPrefix = 'order-pickup:';
      
      if (!scannedValue || !scannedValue.startsWith(expectedPrefix)) {
        throw new Error('Invalid QR code');
      }
  
      const orderId = scannedValue.replace(expectedPrefix, '');
      
      // Additional logging for debugging
      console.log('Scanned Order ID:', orderId);
      console.log('Current Orders:', orders.map(o => o.id));
  
      const scanningOrder = orders.find(order => order.id === orderId);
  
      if (!scanningOrder) {
        // If order not found, force a refresh and try again
        await fetchOrders();
        const refreshedScanningOrder = orders.find(order => order.id === orderId);
        
        if (!refreshedScanningOrder) {
          throw new Error('Order not found');
        }
      }
  
      if (scanningOrder.status !== 'completed') {
        throw new Error('Order is not ready for pickup');
      }
  
      // Show the order details modal
      setScannedOrderModal({ isOpen: true, order: scanningOrder });
  
      await updateDoc(doc(firestore, 'orders', orderId), {
        status: 'picked_up',
        pickedUpAt: new Date()
      });
  
      setLastScannedOrderId(orderId);
      await fetchOrders();
  
      toast({
        title: 'Order Picked Up',
        description: 'Order has been successfully picked up',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex direction={{ base: 'column', xl: 'row' }} gap={6}>
        

        <Box flex="1" position="sticky" top="20px" height="fit-content">
          <Box borderWidth={1} borderRadius="lg" p={4} bg={useColorModeValue('white', 'gray.800')}>
            <Heading size="md" mb={4} textAlign="center">Quick Pickup Scanner</Heading>
            <Scanner 
              onScan={handlePersistentQRScan} 
              onError={(error) => console.error(error?.message)}
            />
            {lastScannedOrderId && (
              <Alert status="success" mt={4}>
                <AlertIcon />
                Last scanned: Order #{lastScannedOrderId.slice(-6)}
              </Alert>
            )}
          </Box>
        </Box>
      </Flex>

      <QRScannerModal
        isOpen={qrScannerModal.isOpen}
        onClose={() => setQRScannerModal({ isOpen: false, order: null })}
        order={qrScannerModal.order}
        onScanComplete={handleQRScanComplete}
      />

<OrderDetailsModal
        isOpen={scannedOrderModal.isOpen}
        onClose={() => setScannedOrderModal({ isOpen: false, order: null })}
        order={scannedOrderModal.order}
      />
    </Container>
  );
};

export default VendorOrderDashboard;