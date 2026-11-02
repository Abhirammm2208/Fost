import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  HStack,
  IconButton,
  useColorModeValue,
  Badge,
  useToast,
  Text
} from '@chakra-ui/react';
import { SearchIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import OrderDetails from '../../Components/order/OrderDetails';
import CancelOrderDialog from '../utils/CancelOrderDialog';
import OrderScanner from '../../Components/externalScanner';

const ProcessingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchProcessingOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const firestore = getFirestore();
      const ordersRef = collection(firestore, 'orders');
      const q = query(
        ordersRef,
        where('shopId', '==', user.shopId),
        where('status', '==', 'processing')
      );
      
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error fetching orders',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const sendNotification = async (orderData) => {
    try {
      // Get full order details if needed
      const firestore = getFirestore();
      const orderRef = doc(firestore, 'orders', orderData.id);
      const orderSnapshot = await getDoc(orderRef);
      const fullOrderData = orderSnapshot.data();

      // Extract email using multiple fallback options
      const customerEmail = 
        fullOrderData.customer?.email || 
        fullOrderData.email || 
        fullOrderData.customerEmail || 
        fullOrderData.user?.email;

      if (!customerEmail) {
        throw new Error('Customer email not found in order data');
      }

      // Prepare notification payload
      const notificationPayload = {
        orderId: orderData.id,
        customerEmail: customerEmail,
        shopName: fullOrderData.shopName || 'Our Shop',
        customerName: fullOrderData.customer?.name || fullOrderData.name || 'Customer',
        items: fullOrderData.items?.map(item => `${item.quantity} x ${item.name}`).join(', ') || 'No items',
      };

      // Send notification
      await axios.post('https://fosterman.click/sendnotification', notificationPayload);

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setIsUpdating(true);
      const firestore = getFirestore();
      const orderRef = doc(firestore, 'orders', orderId);
      
      // Get the order data before updating
      const orderSnapshot = await getDoc(orderRef);
      const orderData = { id: orderId, ...orderSnapshot.data() };

      // Update order status
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // If order is completed, send notification
      if (newStatus === 'completed') {
        try {
          await sendNotification(orderData);
          console.log('Notification sent for order:', orderId);
        } catch (notificationError) {
          console.error('Notification error:', notificationError);
          // Show warning toast but don't fail the status update
          toast({
            title: 'Notification Warning',
            description: 'Order updated but customer notification failed',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );

      // Show success toast
      toast({
        title: 'Order updated',
        description: `Order #${orderId.slice(-6)} has been ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error updating order',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchProcessingOrders();
    const interval = setInterval(fetchProcessingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteClick = async (e, order) => {
    e.stopPropagation();
    await handleStatusUpdate(order.id, 'completed');
  };

  const handleCancelClick = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setIsCancelDialogOpen(true);
  };

  const calculateTotalItems = (items) => {
    return items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxW="container.xl" py={8}>
      <Box
        bg={bgColor}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        boxShadow="sm"
      >
        <Box p={6}>
          <Flex justify="space-between" align="center" mb={6}>
            <Box>
              <Heading size="lg">Processing Orders</Heading>
              <Text color="gray.600" mt={1}>
                {orders.length} order{orders.length !== 1 ? 's' : ''} in process
              </Text>
            </Box>
            <HStack spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="md"
                />
              </InputGroup>
            </HStack>
          </Flex>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Items</Th>
                  <Th>Quantity</Th>
                  <Th>Price</Th>
                  <Th>Time/Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={8}>
                      <Text color="gray.500">No processing orders found</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredOrders.map((order) => (
                    <Tr 
                      key={order.id} 
                      _hover={{ bg: 'gray.50', cursor: 'pointer' }} 
                      onClick={() => handleRowClick(order)}
                    >
                      <Td>
                        <Text fontWeight="medium">#{order.id.slice(-6)}</Text>
                      </Td>
                      <Td>
                        <Text>{order.customer?.name || 'N/A'}</Text>
                        {order.customer?.phone && (
                          <Text fontSize="sm" color="gray.500">
                            {order.customer.phone}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Text noOfLines={2}>
                          {order.items?.map(item => item.name).join(', ')}
                        </Text>
                      </Td>
                      <Td>{calculateTotalItems(order.items)}</Td>
                      <Td>
                        <Text fontWeight="medium">
                          Rs.{order.total?.toFixed(2) || '0.00'}
                        </Text>
                      </Td>
                      <Td>
                        <Text>{formatDate(order.createdAt)}</Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme="blue"
                          py={1}
                          px={2}
                          borderRadius="full"
                        >
                          Processing
                        </Badge>
                      </Td>
                      <Td onClick={e => e.stopPropagation()}>
                        <HStack spacing={2}>
                          <IconButton
                            colorScheme="green"
                            aria-label="Complete order"
                            icon={<CheckIcon />}
                            size="sm"
                            isLoading={isUpdating}
                            onClick={(e) => handleCompleteClick(e, order)}
                          />
                          <IconButton
                            colorScheme="red"
                            aria-label="Cancel order"
                            icon={<CloseIcon />}
                            size="sm"
                            isLoading={isUpdating}
                            onClick={(e) => handleCancelClick(e, order)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </Box>
      <OrderScanner 
        onOrderProcessed={(orderId) => {
          fetchProcessingOrders();
        }} 
      />
      <OrderDetails
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdating}
      />
      <CancelOrderDialog
        isOpen={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setSelectedOrder(null);
        }}
        orderId={selectedOrder?.id}
        orderData={selectedOrder}
        onOrderCancelled={(orderId) => {
          setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        }}
      />
    </Container>
  );
};

export default ProcessingOrders;