import React, { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Container, Divider, Flex, Heading, HStack, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { CalendarDays, ChevronRight, CircleCheck, Clock3, PackageCheck, Store } from 'lucide-react';
import { format } from 'date-fns';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) throw new Error('Please sign in to view your orders.');
        const snapshot = await getDocs(query(collection(getFirestore(), 'orders'), where('customerEmail', '==', user.email)));
        const list = snapshot.docs.map((order) => ({ id: order.id, ...order.data(), createdAt: order.data().createdAt?.toDate?.() || new Date() }));
        setOrders(list.sort((first, second) => second.createdAt - first.createdAt));
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusMeta = (status) => {
    const key = String(status || '').toLowerCase();
    if (key === 'completed' || key === 'picked_up') return { color: 'green', icon: CircleCheck, label: key === 'picked_up' ? 'Picked up' : 'Ready / completed' };
    if (key === 'processing') return { color: 'blue', icon: Clock3, label: 'Being prepared' };
    if (key === 'cancelled') return { color: 'red', icon: CircleCheck, label: 'Cancelled' };
    return { color: 'orange', icon: Clock3, label: 'Order received' };
  };

  if (loading) return <Flex minH="70vh" justify="center" align="center" bg="canvas"><Spinner size="xl" color="brand.500" thickness="4px" /></Flex>;
  if (error) return <Container maxW="1000px" py={12}><Alert status="error" borderRadius="14px"><AlertIcon />{error}</Alert></Container>;

  return <Box className="app-page"><Container maxW="1100px" px={{ base: 4, md: 6 }} py={{ base: 8, md: 14 }}><Flex justify="space-between" align="end" gap={4}><Box><Text className="eyebrow">YOUR FOST HISTORY</Text><Heading mt={2} fontSize={{ base: '3xl', md: '5xl' }}>My orders</Heading><Text mt={3} color="gray.500">A little record of everything good you’ve picked up.</Text></Box><PackageCheck size={42} color="#f26a3d" /></Flex>{orders.length === 0 ? <Box className="soft-card" mt={10} p={{ base: 8, md: 14 }} textAlign="center"><Box display="inline-flex" bg="moss.50" color="moss.600" p={4} borderRadius="full"><PackageCheck size={24} /></Box><Heading mt={4} fontSize="xl">No orders yet</Heading><Text mt={2} color="gray.500">Your next favourite meal is only a few taps away.</Text></Box> : <SimpleGrid mt={10} columns={{ base: 1, lg: 2 }} spacing={5}>{orders.map((order) => { const meta = statusMeta(order.status); const StatusIcon = meta.icon; return <Box key={order.id} className="soft-card" p={{ base: 5, md: 6 }}><Flex justify="space-between" align="start" gap={3}><HStack spacing={3} align="start"><Box bg={`${meta.color}.50`} color={`${meta.color}.600`} p={2.5} borderRadius="11px"><StatusIcon size={19} /></Box><Box><Text className="eyebrow" fontSize="10px">ORDER #{order.id.slice(-6)}</Text><Text fontWeight="800" mt={1}>{order.shopName || 'Food court'}</Text></Box></HStack><Badge colorScheme={meta.color} borderRadius="full" px={2.5} py={1}>{meta.label}</Badge></Flex><HStack mt={5} color="gray.500" fontSize="sm" spacing={4}><HStack spacing={1.5}><CalendarDays size={14} /><Text>{format(order.createdAt, 'PP')}</Text></HStack><HStack spacing={1.5}><Store size={14} /><Text>Pickup</Text></HStack></HStack><Divider my={5} /><VStack align="stretch" spacing={2}>{(order.items || []).map((item, index) => <Flex key={`${item.name}-${index}`} justify="space-between" fontSize="sm"><Text color="gray.600">{item.quantity} × {item.name}</Text><Text fontWeight="600">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</Text></Flex>)}</VStack><Divider my={5} /><Flex justify="space-between" align="center"><Text color="gray.500" fontSize="sm">Total paid</Text><Text fontSize="xl" fontWeight="800" color="brand.600">₹{Number(order.total || 0).toFixed(2)}</Text></Flex>{order.pickupCode && <Box mt={5} bg="moss.50" borderRadius="12px" p={3}><Text fontSize="xs" color="moss.700" fontWeight="700" letterSpacing=".08em">PICKUP CODE</Text><Text fontFamily="heading" fontSize="2xl" color="moss.800" letterSpacing=".12em">{order.pickupCode}</Text></Box>}<HStack mt={5} color="moss.600" fontSize="sm" fontWeight="700"><Text>View order details</Text><ChevronRight size={16} /></HStack></Box>; })}</SimpleGrid>}</Container></Box>;
};

export default UserOrders;
