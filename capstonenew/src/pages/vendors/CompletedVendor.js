import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Box,
  Heading,
  Alert,
  AlertIcon,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  useToast,
  Text
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const OrderScanningPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastScannedOrderId, setLastScannedOrderId] = useState(null);
  const toast = useToast();
  const firestore = getFirestore();

  // Fetch both completed and picked up orders from Firestore
  const fetchOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.shopId) {
        throw new Error('Shop ID not found. Please login again.');
      }

      const ordersRef = collection(firestore, 'orders');
      const q = query(
        ordersRef,
        where('shopId', '==', user.shopId),
        where('status', 'in', ['completed', 'picked_up']) // Query both statuses
      );
      
      const snapshot = await getDocs(q);
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date(),
        pickedUpAt: doc.data().pickedUpAt?.toDate?.() || new Date(doc.data().pickedUpAt)
      }));

      // Sort orders by picked up status and then by date
      const sortedOrders = allOrders.sort((a, b) => {
        if (a.status === b.status) {
          return b.createdAt - a.createdAt;
        }
        return a.status === 'completed' ? -1 : 1;
      });

      setOrders(sortedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Update order status to picked up
  const updateOrderStatus = async (orderId) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'picked_up',
        pickedUpAt: new Date()
      });

      setLastScannedOrderId(orderId);
      await fetchOrders();

      toast({
        title: 'Success',
        description: 'Order has been marked as picked up',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch orders on component mount and every 30 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const colorScheme = status === 'completed' ? 'green' : 'purple';
    const statusText = status === 'completed' ? 'Ready' : 'Picked';
    return (
      <Badge colorScheme={colorScheme} py={1} px={2} borderRadius="full">
        • {statusText}
      </Badge>
    );
  };

  // Format date helper function
  const formatDate = (date) => {
    return date ? date.toLocaleString() : 'N/A';
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Order Scanning Summary</Heading>

        <Box>
          <InputGroup>
            <InputLeftElement>
              <Search className="text-gray-400" size={20} />
            </InputLeftElement>
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              width="300px"
            />
          </InputGroup>
        </Box>

        {lastScannedOrderId && (
          <Alert status="success" mb={4}>
            <AlertIcon />
            Last scanned order: #{lastScannedOrderId.slice(-6)}
          </Alert>
        )}

        <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Order #</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th isNumeric>Quantity</Th>
                <Th isNumeric>Price</Th>
                <Th>Order Time</Th>
                <Th>Pickup Time</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOrders.map((order) => (
                <Tr 
                  key={order.id}
                  bg={order.status === 'picked_up' ? 'gray.50' : 'white'}
                >
                  <Td fontWeight="medium">#{order.id.slice(-6)}</Td>
                  <Td>{order.customer?.name || 'N/A'}</Td>
                  <Td>{order.items?.[0]?.name || 'N/A'}</Td>
                  <Td isNumeric>{order.items?.[0]?.quantity || 1}</Td>
                  <Td isNumeric>Rs.{order.total?.toFixed(2) || '0.00'}</Td>
                  <Td>{formatDate(order.createdAt)}</Td>
                  <Td>{order.status === 'picked_up' ? formatDate(order.pickedUpAt) : '-'}</Td>
                  <Td>{getStatusBadge(order.status)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box textAlign="center" mt={4}>
          <Text color="gray.500">Scan QR code to mark order as picked up</Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default OrderScanningPage;