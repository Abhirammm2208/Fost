import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { collection, getDocs, getFirestore, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { ArrowRight, Check, Clock3, MapPin, PackageCheck, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { app } from '../../Components/firebase/Firebase';
import BannerCarousel from '../../Components/banner/Banner';
import FoodCategories from '../../Components/FoodCategories';

const OrderCard = ({ order, onViewDetails }) => (
  <Box className="soft-card" p={{ base: 4, md: 5 }}>
    <Flex justify="space-between" align={{ base: 'start', sm: 'center' }} gap={4} direction={{ base: 'column', sm: 'row' }}>
      <HStack align="start" spacing={3}>
        <Box bg="moss.50" color="moss.600" p={3} borderRadius="14px"><ShoppingBag size={19} /></Box>
        <Box>
          <Text fontWeight="700">{order.shopName || 'Food stall'}</Text>
          <Text color="gray.500" fontSize="sm">Order #{order.id.slice(-6)}</Text>
          <Badge mt={2} colorScheme={order.status === 'completed' ? 'green' : order.status === 'processing' ? 'blue' : 'orange'} borderRadius="full" px={2.5} textTransform="capitalize">{order.status}</Badge>
        </Box>
      </HStack>
      <Button size="sm" variant="outline" colorScheme="moss" onClick={() => onViewDetails(order.id)} rightIcon={<ArrowRight size={15} />}>Track order</Button>
    </Flex>
  </Box>
);

const PopularShopCard = ({ shop, onClick }) => {
  const rating = Number(shop.rating || 4.2);
  return (
    <Box className="soft-card lift-card" overflow="hidden" cursor={shop.isOpen ? 'pointer' : 'not-allowed'} opacity={shop.isOpen === false ? .65 : 1} onClick={shop.isOpen ? onClick : undefined}>
      <Box h={{ base: '150px', md: '210px' }} position="relative" overflow="hidden">
        <Image src={shop.imageUrl} alt={shop.name} w="full" h="full" objectFit="cover" filter={shop.isOpen === false ? 'grayscale(100%)' : 'none'} transition="transform .4s" _groupHover={{ transform: 'scale(1.04)' }} />
        <HStack position="absolute" top={3} left={3} bg="white" px={2.5} py={1.5} borderRadius="full" spacing={1} fontSize="xs" fontWeight="700"><Star size={13} fill="#f7b928" color="#f7b928" />{rating.toFixed(1)}</HStack>
        {shop.isOpen === false && <Badge position="absolute" bottom={3} left={3} bg="ink" color="white" borderRadius="full" px={2.5}>Closed right now</Badge>}
      </Box>
      <Box p={{ base: 3, md: 4 }}>
        <Flex justify="space-between" gap={2} align="center"><Text fontWeight="700" fontSize={{ base: 'md', md: 'lg' }} noOfLines={1}>{shop.name}</Text><Clock3 size={16} color="#198b5d" /></Flex>
        <Text color="gray.500" fontSize="sm" mt={1} noOfLines={1}>{shop.description || 'Freshly prepared, ready for pickup'}</Text>
        <Text color="moss.600" fontSize="xs" fontWeight="700" mt={3}>VIEW MENU <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></Text>
      </Box>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const firestore = getFirestore(app);
  const [activeOrders, setActiveOrders] = useState([]);
  const [popularShops, setPopularShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    const loadPopularShops = async () => {
      try {
        const shopsQuery = query(collection(firestore, 'shops'), orderBy('createdAt', 'asc'), limit(4));
        const snapshot = await getDocs(shopsQuery);
        setPopularShops(snapshot.docs.map((shop) => ({ id: shop.id, ...shop.data() })));
      } catch (error) {
        console.error('Error fetching popular shops:', error);
      }
    };
    loadPopularShops();
  }, [firestore]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      setLoading(false);
      return undefined;
    }

    const ordersQuery = query(collection(firestore, 'orders'), where('userId', '==', user.uid), where('status', '!=', 'picked_up'));
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      setActiveOrders(snapshot.docs.map((order) => ({ id: order.id, ...order.data() })));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching active orders:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  if (loading) return <Flex minH="70vh" justify="center" align="center" bg="canvas"><Spinner size="xl" color="brand.500" thickness="4px" /></Flex>;

  return (
    <Box className="app-page">
      <Container maxW="1240px" px={{ base: 4, md: 6 }} pb={{ base: 12, md: 20 }}>
        {activeOrders.length > 0 && <Box pt={{ base: 5, md: 7 }}>
          <Flex bg="moss.700" color="white" borderRadius="20px" p={{ base: 4, md: 5 }} align="center" justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }}>
            <HStack align="center" spacing={3}><Box bg="whiteAlpha.200" p={3} borderRadius="14px"><PackageCheck size={22} /></Box><Box><Text fontWeight="700">{activeOrders.length} order{activeOrders.length > 1 ? 's' : ''} in progress</Text><Text fontSize="sm" color="moss.100">We’re getting it ready for pickup.</Text></Box></HStack>
            <Button bg="white" color="moss.700" size="sm" onClick={() => setIsOrderModalOpen(true)} rightIcon={<ArrowRight size={16} />} _hover={{ bg: 'moss.50' }}>See updates</Button>
          </Flex>
        </Box>}

        <Box pt={{ base: 8, md: 14 }}>
          <Flex direction={{ base: 'column', lg: 'row' }} align="center" gap={{ base: 8, lg: 14 }}>
            <Box flex="1" maxW="590px">
              <HStack className="eyebrow" spacing={2}><Box w="8px" h="8px" bg="brand.500" borderRadius="full" /><Text>YOUR LOCAL FOOD GUIDE</Text></HStack>
              <Heading as="h1" mt={5} fontSize={{ base: '46px', sm: '64px', lg: '78px' }} lineHeight=".97" maxW="600px">Good food.<br /><Box as="span" color="brand.500">Zero queues.</Box></Heading>
              <Text mt={6} color="gray.600" fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.7" maxW="490px">Find your favourite local stalls, order ahead, and pick up something delicious when it’s ready.</Text>
              <HStack mt={8} spacing={3} flexWrap="wrap"><Button size="lg" colorScheme="brand" onClick={() => navigate('/main')} rightIcon={<ArrowRight size={18} />}>Explore food courts</Button><Button size="lg" variant="ghost" onClick={() => navigate('/HowItWorks')} color="ink">How it works</Button></HStack>
              <SimpleGrid columns={3} spacing={{ base: 4, md: 8 }} mt={10} maxW="450px">
                {[['10 min', 'average pickup'], ['local', 'stalls nearby'], ['100%', 'pickup fresh']].map(([value, label]) => <Box key={label}><Text fontFamily="heading" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">{value}</Text><Text fontSize="xs" color="gray.500" mt={1}>{label}</Text></Box>)}
              </SimpleGrid>
            </Box>
            <Box flex="1" w="full" position="relative" maxW="590px">
              <Box position="absolute" w="130px" h="130px" bg="sun" borderRadius="full" top="-22px" right="-18px" opacity=".65" />
              <Box position="relative" bg="white" p={{ base: 2, md: 3 }} borderRadius="26px" boxShadow="0 24px 60px rgba(24,35,29,.14)"><BannerCarousel /></Box>
              <HStack position="absolute" bottom={{ base: '-18px', md: '-22px' }} left={{ base: 4, md: 8 }} bg="white" border="1px solid" borderColor="blackAlpha.100" shadow="lg" borderRadius="16px" px={4} py={3} spacing={3}><Box bg="moss.50" color="moss.600" p={2} borderRadius="10px"><MapPin size={18} /></Box><Box><Text fontSize="xs" color="gray.500">PICKUP MADE SIMPLE</Text><Text fontWeight="700" fontSize="sm">Order. Collect. Enjoy.</Text></Box></HStack>
            </Box>
          </Flex>
        </Box>

        <Box mt={{ base: 20, md: 28 }}><Flex align="end" justify="space-between" mb={5} gap={3}><Box><Text className="eyebrow">ONE TAP AWAY</Text><Heading mt={2} fontSize={{ base: '2xl', md: '3xl' }}>What are you craving?</Heading></Box><Button variant="ghost" color="moss.600" display={{ base: 'none', sm: 'flex' }} onClick={() => navigate('/main')} rightIcon={<ArrowRight size={15} />}>See all</Button></Flex><FoodCategories /></Box>

        <Box mt={{ base: 14, md: 24 }}><Flex align="end" justify="space-between" mb={6}><Box><Text className="eyebrow">DISCOVER NEARBY</Text><Heading mt={2} fontSize={{ base: '2xl', md: '3xl' }}>Popular food courts</Heading></Box><Button variant="ghost" color="moss.600" display={{ base: 'none', sm: 'flex' }} onClick={() => navigate('/main')} rightIcon={<ArrowRight size={15} />}>Browse all</Button></Flex>{popularShops.length > 0 ? <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 5 }}>{popularShops.map((shop) => <PopularShopCard key={shop.id} shop={shop} onClick={() => navigate(`/shop/${shop.id}`)} />)}</SimpleGrid> : <Box className="soft-card" p={8} textAlign="center"><Text color="gray.500">New food courts are being added soon.</Text></Box>}</Box>

        <Flex mt={{ base: 12, md: 20 }} bg="brand.50" border="1px solid" borderColor="brand.100" borderRadius="22px" p={{ base: 5, md: 7 }} align={{ base: 'start', md: 'center' }} gap={4} direction={{ base: 'column', md: 'row' }}><Box bg="brand.100" color="brand.700" p={3} borderRadius="14px"><Check size={21} /></Box><Box flex="1"><Text fontWeight="700">Pickup only, always fresh</Text><Text color="gray.600" fontSize="sm" mt={1}>Skip the delivery wait. Your order is prepared for you and ready to collect from the stall.</Text></Box><Text fontSize="xs" color="gray.500" fontWeight="700" letterSpacing=".04em">FSSAI 23624032004962</Text></Flex>
      </Container>

      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" />
        <ModalContent borderRadius="22px" mx={4} overflow="hidden"><ModalHeader fontFamily="heading" borderBottom="1px solid" borderColor="gray.100">Your active orders</ModalHeader><ModalCloseButton /><ModalBody p={{ base: 4, md: 6 }}><VStack spacing={3} align="stretch">{activeOrders.length ? activeOrders.map((order) => <OrderCard key={order.id} order={order} onViewDetails={(id) => navigate(`/order-waiting/${id}`)} />) : <Text color="gray.500" textAlign="center" py={8}>You don’t have any active orders.</Text>}</VStack></ModalBody><ModalFooter><Button variant="ghost" onClick={() => setIsOrderModalOpen(false)}>Close</Button></ModalFooter></ModalContent>
      </Modal>
    </Box>
  );
};

export default Home;
