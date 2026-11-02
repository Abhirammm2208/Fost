import React, { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Container, Divider, Flex, Heading, HStack, SimpleGrid, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack, useToast } from '@chakra-ui/react';
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, where } from 'firebase/firestore';
import { Award, CalendarDays, CircleCheck, Clock3, History, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import UserLevelStatus from './UserLevelStatus';
import HealthPointsDisplay from '../utils/HealthPointDisplay';

const UserProfile = () => {
  const [orders, setOrders] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const toast = useToast();
  const firestore = getFirestore();

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) throw new Error('Please sign in to view your profile.');
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
        const ordersRef = collection(firestore, 'orders');
        let snapshot;
        try {
          snapshot = await getDocs(query(ordersRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc')));
        } catch (indexErr) {
          if (indexErr.code !== 'failed-precondition') throw indexErr;
          snapshot = await getDocs(query(ordersRef, where('userId', '==', user.uid)));
          setIndexError({ message: 'Orders are shown without date sorting until the Firestore index is available.' });
        }
        const orderList = snapshot.docs.map((order) => ({ id: order.id, ...order.data(), createdAt: order.data().createdAt?.toDate?.() || new Date(), completedAt: order.data().completedAt?.toDate?.(), pickedUpAt: order.data().pickedUpAt?.toDate?.() }));
        setOrders(orderList.sort((first, second) => second.createdAt - first.createdAt));
      } catch (fetchError) {
        setError(fetchError.message);
        toast({ title: 'Could not load your profile', description: 'Please try again in a moment.', status: 'error', duration: 4000, isClosable: true });
      } finally { setLoading(false); }
    };
    initializeProfile();
  }, [firestore, toast]);

  const statusMeta = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed' || normalized === 'picked_up') return { color: 'green', icon: CircleCheck, label: normalized === 'picked_up' ? 'Picked up' : 'Ready / completed' };
    if (normalized === 'processing') return { color: 'blue', icon: Clock3, label: 'Being prepared' };
    if (normalized === 'cancelled') return { color: 'red', icon: History, label: 'Cancelled' };
    return { color: 'orange', icon: Clock3, label: 'Order received' };
  };

  const OrderCard = ({ order }) => {
    const meta = statusMeta(order.status);
    const StatusIcon = meta.icon;
    return <Box className="soft-card" p={{ base: 5, md: 6 }}><Flex justify="space-between" align="start" gap={3}><HStack align="start" spacing={3}><Box bg={`${meta.color}.50`} color={`${meta.color}.600`} p={2.5} borderRadius="11px"><StatusIcon size={18} /></Box><Box><Text className="eyebrow" fontSize="10px">ORDER #{order.id.slice(-6)}</Text><Text fontWeight="800" mt={1}>{order.shopName || 'Food court'}</Text></Box></HStack><Badge colorScheme={meta.color} borderRadius="full" px={2.5}>{meta.label}</Badge></Flex><HStack mt={5} fontSize="sm" color="gray.500" spacing={4}><HStack spacing={1.5}><CalendarDays size={14} /><Text>{format(order.createdAt, 'PPp')}</Text></HStack></HStack><Divider my={5} /><VStack align="stretch" spacing={2}>{(order.items || []).map((item, index) => <Flex key={`${item.name}-${index}`} justify="space-between" fontSize="sm"><Text color="gray.600">{item.quantity} × {item.name}</Text><Text fontWeight="600">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</Text></Flex>)}</VStack><Divider my={5} /><Flex justify="space-between"><Text color="gray.500">Total</Text><Text fontSize="lg" fontWeight="800" color="brand.600">₹{Number(order.total || 0).toFixed(2)}</Text></Flex>{order.pickupCode && <Box mt={5} bg="moss.50" p={3} borderRadius="12px"><Text fontSize="10px" fontWeight="800" letterSpacing=".1em" color="moss.700">PICKUP CODE</Text><Text fontFamily="heading" fontSize="2xl" letterSpacing=".12em" color="moss.800">{order.pickupCode}</Text></Box>}</Box>;
  };

  if (loading) return <Flex minH="70vh" align="center" justify="center" bg="canvas"><Spinner size="xl" color="brand.500" thickness="4px" /></Flex>;
  if (error) return <Container maxW="1000px" py={12}><Alert status="error" borderRadius="14px"><AlertIcon />{error}</Alert></Container>;

  const ongoingOrders = orders.filter((order) => ['pending', 'processing', 'completed'].includes(order.status));
  const pastOrders = orders.filter((order) => ['picked_up', 'cancelled'].includes(order.status));
  const email = JSON.parse(localStorage.getItem('user') || '{}').email || userData?.email || '';

  return <Box className="app-page"><Container maxW="1150px" px={{ base: 4, md: 6 }} py={{ base: 8, md: 14 }}><Flex align={{ base: 'start', md: 'center' }} gap={5} direction={{ base: 'column', md: 'row' }}><Box bg="brand.50" color="brand.600" p={4} borderRadius="18px"><UserRound size={28} /></Box><Box flex="1"><Text className="eyebrow">YOUR FOST SPACE</Text><Heading mt={2} fontSize={{ base: '3xl', md: '5xl' }}>Hey, {email.split('@')[0] || 'there'}.</Heading><Text color="gray.500" mt={2}>Track your progress and revisit every order.</Text></Box><HStack bg="sun" color="ink" borderRadius="14px" px={4} py={3} spacing={2}><Award size={18} /><Text fontWeight="700" fontSize="sm">Member since FOST</Text></HStack></Flex>{indexError && <Alert mt={6} status="info" borderRadius="14px"><AlertIcon />{indexError.message}</Alert>}<SimpleGrid mt={8} columns={{ base: 1, lg: 2 }} spacing={5}>{userData && <HealthPointsDisplay points={userData.points || 0} />}<UserLevelStatus orderCount={orders.length} /></SimpleGrid><Box mt={10}><Flex justify="space-between" align="end" mb={5}><Box><Text className="eyebrow">ORDER ACTIVITY</Text><Heading mt={2} fontSize={{ base: '2xl', md: '3xl' }}>Your orders</Heading></Box><Text color="gray.500" fontSize="sm">{orders.length} total</Text></Flex><Tabs variant="soft-rounded" colorScheme="brand"><TabList bg="white" border="1px solid" borderColor="gray.100" p={1.5} borderRadius="14px" w="fit-content"><Tab fontSize="sm">In progress · {ongoingOrders.length}</Tab><Tab fontSize="sm">History · {pastOrders.length}</Tab></TabList><TabPanels px={0} pt={6}><TabPanel p={0}>{ongoingOrders.length ? <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>{ongoingOrders.map((order) => <OrderCard key={order.id} order={order} />)}</SimpleGrid> : <Box className="soft-card" p={10} textAlign="center"><Text color="gray.500">No ongoing orders right now.</Text></Box>}</TabPanel><TabPanel p={0}>{pastOrders.length ? <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>{pastOrders.map((order) => <OrderCard key={order.id} order={order} />)}</SimpleGrid> : <Box className="soft-card" p={10} textAlign="center"><Text color="gray.500">Your completed orders will appear here.</Text></Box>}</TabPanel></TabPanels></Tabs></Box></Container></Box>;
};

export default UserProfile;
