import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Divider,
  useToast,
  Flex
} from '@chakra-ui/react';
import { CheckIcon, TimeIcon } from '@chakra-ui/icons';

const OrderProcessPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const firestore = getFirestore();
  const toast = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('shopName', '==', 'Grocery Store'));
      const snapshot = await getDocs(q);
      
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date()
      }));
      
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'processing': return 'blue';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  const OrderCard = ({ order }) => (
    <Card width="100%" variant="outline">
      <CardHeader>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="md">Order #{order.id.slice(-6)}</Heading>
            <Text color="gray.500" fontSize="sm">
              {order.createdAt.toLocaleString()}
            </Text>
          </Box>
          <Badge colorScheme={getStatusColor(order.status)} fontSize="0.8em">
            {order.status.toUpperCase()}
          </Badge>
        </Flex>
      </CardHeader>
      <CardBody>
        <Stack spacing={4}>
          <Box>
            <Text fontWeight="bold">Order Items:</Text>
            <VStack align="stretch" mt={2} spacing={1}>
              {order.items?.map((item, index) => (
                <HStack key={index} justify="space-between">
                  <Text>{item.quantity}x {item.name}</Text>
                  <Text>${item.price}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
          <Divider />
          <HStack justify="space-between">
            <Text fontWeight="bold">Total:</Text>
            <Text fontWeight="bold">${order.total}</Text>
          </HStack>
          {order.status === 'pending' && (
            <Button
              leftIcon={<TimeIcon />}
              colorScheme="blue"
              onClick={() => handleStatusUpdate(order.id, 'processing')}
            >
              Start Processing
            </Button>
          )}
          {order.status === 'processing' && (
            <Button
              leftIcon={<CheckIcon />}
              colorScheme="green"
              onClick={() => handleStatusUpdate(order.id, 'completed')}
            >
              Mark Complete
            </Button>
          )}
        </Stack>
      </CardBody>
    </Card>
  );

  const Section = ({ title, orders, status, colorScheme }) => (
    <Box>
      <HStack mb={4}>
        <Heading size="md">{title}</Heading>
        <Badge colorScheme={colorScheme} fontSize="0.8em">
          {orders.filter(order => order.status === status).length}
        </Badge>
      </HStack>
      <VStack spacing={4} align="stretch">
        {orders
          .filter(order => order.status === status)
          .map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
      </VStack>
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading size="lg">Order Processing Dashboard</Heading>
        <Text color="gray.500">
          {loading ? 'Updating orders...' : `Last updated: ${new Date().toLocaleTimeString()}`}
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        <Section 
          title="Pending Orders" 
          orders={orders} 
          status="pending"
          colorScheme="yellow"
        />
        <Section 
          title="Processing Orders" 
          orders={orders} 
          status="processing"
          colorScheme="blue"
        />
        <Section 
          title="Completed Orders" 
          orders={orders} 
          status="completed"
          colorScheme="green"
        />
      </SimpleGrid>
    </Container>
  );
};

export default OrderProcessPage;