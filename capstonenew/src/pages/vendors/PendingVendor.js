import React, { useState, useEffect } from 'react';
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
  useToast,
  Text,
  Badge
} from '@chakra-ui/react';
import { SearchIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import OrderDetails from '../../Components/order/OrderDetails';
import CancelOrderDialog from '../utils/CancelOrderDialog';
import OrderScanner from '../../Components/externalScanner';


const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchPendingOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const firestore = getFirestore();
      const ordersRef = collection(firestore, 'orders');
      
      const q = query(
        ordersRef,
        where('shopId', '==', user.shopId),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAt: data.createdAt || new Date().toISOString(),
          customerEmail: data.customerEmail || 'N/A',
          customerId: data.customerId || 'N/A',
          items: (data.items || []).map(item => ({
            category: item.category || 'N/A',
            description: item.description || '',
            dietType: item.dietType || 'N/A',
            id: item.id || '',
            imageUrl: item.imageUrl || '',
            isActive: item.isActive || false,
            name: item.name || 'Unnamed Item',
            price: item.price || 0,
            quantity: item.quantity || 1,
            shopId: item.shopId || '',
            shopName: item.shopName || '',
            vendorId: item.vendorId || ''
          })),
          processedAt: data.processedAt || null,
          shopId: data.shopId || '',
          shopName: data.shopName || '',
          status: data.status || 'pending',
          totalAmount: data.totalAmount || 0,
          updatedAt: data.updatedAt || new Date().toISOString(),
          customer: {
            name: data.customerName || 'Guest',
            phone: data.customerPhone || 'N/A'
          },
          clearCart: data.clearCart || false,
          confirmedAt: data.confirmedAt || null,
          feedbackSubmitted: data.feedbackSubmitted || false
        };
      });
      
      setOrders(ordersData);

      if (ordersData.length > previousOrderCount) {
        const audio = new Audio('../../Assets/level-up-191997.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        toast({
          title: 'New Orders!',
          description: `You have ${ordersData.length - previousOrderCount} new order(s)`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      
      setPreviousOrderCount(ordersData.length);
      
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setIsUpdating(true);
      const firestore = getFirestore();
      const orderRef = doc(firestore, 'orders', orderId);
      
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        processedAt: newStatus === 'processing' ? new Date().toISOString() : null
      });

      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );

      toast({
        title: 'Order updated',
        description: `Order #${orderId.slice(-6)} has been moved to ${newStatus}`,
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

  const handleAcceptClick = async (e, order) => {
    e.stopPropagation();
    
    try {
      // Prepare the order data for printing
      const printData = {
        orderId: order.id,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shopName: order.shopName || 'Your Shop Name',
        customerName: order.customerName
      };
  
      // Use the full URL to your backend server
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5337'; // Adjust port as needed
      const response = await fetch(`${BACKEND_URL}/print-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printData)
      });
  
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text(); // Get error text instead of trying to parse JSON
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
  
      // Show success toast
      toast({
        title: 'Receipt Printed',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
  
      // Update order status
      await handleStatusUpdate(order.id, 'processing');
  
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: 'Error Processing Order',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancelClick = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setIsCancelDialogOpen(true);
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const calculateTotalItems = (items) => {
    return items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const event = new CustomEvent('newPendingOrder', {
      detail: { orderCount: orders.length }
    });
    window.dispatchEvent(event);
  }, [orders]);

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
              <Heading size="lg">Pending Orders</Heading>
              <Text color="gray.600" mt={1}>
                {orders.length} order{orders.length !== 1 ? 's' : ''} waiting
              </Text>
            </Box>
            <HStack spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search orders"
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
                  <Th>Order ID</Th>
                  <Th>Customer</Th>
                  <Th>Items</Th>
                  <Th>Quantity</Th>
                  <Th>Total Price</Th>
                  <Th>Order Time</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={8}>
                      <Text color="gray.500">No pending orders found</Text>
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
                      <Td>
                        {calculateTotalItems(order.items)}
                      </Td>
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
                          colorScheme="yellow"
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          Pending
                        </Badge>
                      </Td>
                      <Td onClick={e => e.stopPropagation()}>
                        <HStack spacing={2}>
                          <IconButton
                            colorScheme="green"
                            aria-label="Accept order"
                            icon={<CheckIcon />}
                            size="sm"
                            isLoading={isUpdating}
                            onClick={(e) => handleAcceptClick(e, order)}
                          />
                          <IconButton
                            colorScheme="red"
                            aria-label="Reject order"
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
          fetchPendingOrders();
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

export default PendingOrders;