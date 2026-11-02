import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { ArrowLeft, Clock3, ListFilter, MapPin, Plus, ShoppingBag, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { app } from '../../Components/firebase/Firebase';
import ShopItemCard from '../../Components/shopitemcard/ShopItemCard';

const Shop = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const firestore = getFirestore(app);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const categoryRefs = useRef({});
  const [items, setItems] = useState([]);
  const [categorizedItems, setCategorizedItems] = useState({});
  const [shopDetails, setShopDetails] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const shopSnapshot = await getDoc(doc(firestore, 'shops', shopId));
        if (!shopSnapshot.exists()) throw new Error('Shop not found');
        const shop = { id: shopSnapshot.id, ...shopSnapshot.data() };
        setShopDetails(shop);

        const itemsRef = collection(firestore, 'items');
        const queries = [query(itemsRef, where('vendorId', '==', shop.vendorId))];
        if (shop.vendorId) {
          queries.push(query(itemsRef, where('shopId', '==', shop.id)));
          queries.push(query(itemsRef, where('vendorId', 'in', [shop.vendorId, shopId, shop.id])));
        }
        const snapshots = await Promise.all(queries.map((itemQuery) => getDocs(itemQuery)));
        const uniqueItems = Array.from(new Map(snapshots.flatMap((snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))).map((item) => [item.id, item])).values());
        const categorized = uniqueItems.reduce((result, item) => {
          const category = item.category || 'Other favourites';
          result[category] = result[category] || [];
          result[category].push(item);
          return result;
        }, {});
        setItems(uniqueItems);
        setCategorizedItems(categorized);
        setActiveCategory(Object.keys(categorized)[0] || '');
      } catch (fetchError) {
        console.error('Error fetching shop data:', fetchError);
        setError(fetchError.message || 'Could not fetch this menu.');
        toast({ title: 'Could not load menu', description: fetchError.message, status: 'error', duration: 3000, isClosable: true });
      } finally {
        setLoading(false);
      }
    };
    if (shopId) fetchShopData();
  }, [firestore, shopId, toast]);

  const categories = useMemo(() => Object.keys(categorizedItems).filter((category) => categorizedItems[category]?.length), [categorizedItems]);

  const addToCart = (item) => {
    if (item.isActive === false) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex((cartItem) => cartItem.id === item.id);
    if (existingIndex > -1) cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    else cart.push({ ...item, quantity: 1, shopId, shopName: shopDetails?.name });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdate'));
    toast({ title: 'Added to cart', description: `${item.name} is ready when you are.`, status: 'success', duration: 1800, isClosable: true });
  };

  const openItem = (item) => {
    setSelectedItem(item);
    onOpen();
  };

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    categoryRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <Flex minH="70vh" justify="center" align="center" bg="canvas"><Spinner size="xl" color="brand.500" thickness="4px" /></Flex>;

  return (
    <Box className="app-page">
      <Container maxW="1240px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 12 }}>
        <Button variant="ghost" size="sm" pl={0} onClick={() => navigate('/main')} leftIcon={<ArrowLeft size={16} />} color="gray.600" _hover={{ color: 'brand.600' }}>Back to food courts</Button>
        {error ? <Box className="soft-card" mt={6} p={8}><Alert status="error" borderRadius="14px"><AlertIcon />{error}</Alert></Box> : <>
          {shopDetails && <Box mt={5} position="relative" h={{ base: '260px', md: '360px' }} borderRadius="24px" overflow="hidden" boxShadow="0 18px 50px rgba(24,35,29,.12)">
            <Image src={shopDetails.imageUrl} alt={shopDetails.name} w="full" h="full" objectFit="cover" />
            <Box position="absolute" inset={0} bgGradient="linear(to-t, rgba(8,20,14,.82), transparent 70%)" />
            <Box position="absolute" left={{ base: 5, md: 8 }} right={{ base: 5, md: 8 }} bottom={{ base: 5, md: 8 }} color="white"><HStack spacing={2} fontSize="xs" color="sun" fontWeight="700" letterSpacing=".1em"><MapPin size={14} /> LOCAL FOOD COURT</HStack><Heading mt={2} fontSize={{ base: '3xl', md: '5xl' }}>{shopDetails.name}</Heading><Text mt={2} color="whiteAlpha.800" maxW="620px">{shopDetails.description || 'Freshly made food from a local stall, ready when you are.'}</Text><HStack mt={4} spacing={4} fontSize="sm"><HStack><Star size={15} fill="#ffd166" color="#ffd166" /><Text>{Number(shopDetails.rating || 4.3).toFixed(1)}</Text></HStack><HStack><Clock3 size={15} /><Text>{shopDetails.estimatedDeliveryTime || shopDetails.deliveryTime || '15-25'} min pickup</Text></HStack><Badge bg={shopDetails.isOpen === false ? 'red.500' : 'moss.500'} color="white" borderRadius="full" px={2.5}>{shopDetails.isOpen === false ? 'Closed' : 'Open now'}</Badge></HStack></Box>
          </Box>}

          <Flex mt={7} align="center" gap={3} overflowX="auto" pb={2} className="fost-scrollbar"><HStack color="gray.500" mr={2} flexShrink={0}><ListFilter size={16} /><Text fontSize="sm" fontWeight="700">Menu</Text></HStack>{categories.map((category) => <Button key={category} onClick={() => scrollToCategory(category)} size="sm" variant={activeCategory === category ? 'solid' : 'outline'} colorScheme={activeCategory === category ? 'brand' : 'gray'} borderRadius="full" flexShrink={0}>{category}<Badge ml={2} borderRadius="full" colorScheme="gray">{categorizedItems[category].length}</Badge></Button>)}</Flex>

          {items.length === 0 ? <Box className="soft-card" mt={6} p={{ base: 8, md: 14 }} textAlign="center"><Box display="inline-flex" bg="brand.50" color="brand.500" p={4} borderRadius="full"><ShoppingBag size={23} /></Box><Heading mt={4} fontSize="xl">This menu is getting ready</Heading><Text mt={2} color="gray.500">There are no available items in this food court yet.</Text></Box> : <Box mt={7}>{categories.map((category) => <Box key={category} ref={(element) => { categoryRefs.current[category] = element; }} scrollMarginTop="110px" mb={{ base: 10, md: 14 }}><Flex justify="space-between" align="end" mb={5}><Box><Text className="eyebrow">{categorizedItems[category].length} ITEMS</Text><Heading mt={1} fontSize={{ base: '2xl', md: '3xl' }}>{category}</Heading></Box></Flex><Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={{ base: 4, md: 6 }}>{categorizedItems[category].map((item) => <ShopItemCard key={item.id} item={item} onAddToCart={addToCart} onItemClick={openItem} />)}</Grid></Box>)}</Box>}
        </>}
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered><ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" /><ModalContent borderRadius="22px" mx={4} overflow="hidden"><ModalHeader fontFamily="heading">{selectedItem?.name}</ModalHeader><ModalCloseButton /><ModalBody pb={7}>{selectedItem && <VStack align="stretch" spacing={5}><Image src={selectedItem.imageUrl || '/fost . (3).png'} alt={selectedItem.name} h="230px" w="full" objectFit="cover" borderRadius="16px" /><HStack><Badge colorScheme={selectedItem.dietType === 'veg' ? 'green' : 'red'} borderRadius="full" px={2.5}>{selectedItem.dietType === 'veg' ? 'Vegetarian' : 'Non-vegetarian'}</Badge><Text fontWeight="800" color="brand.600">₹{Number(selectedItem.price || 0).toFixed(2)}</Text></HStack><Text color="gray.600" lineHeight="1.7">{selectedItem.description || 'Prepared fresh for pickup.'}</Text><Button colorScheme="brand" size="lg" leftIcon={<Plus size={18} />} isDisabled={selectedItem.isActive === false} onClick={() => { addToCart(selectedItem); onClose(); }}>{selectedItem.isActive === false ? 'Unavailable' : 'Add to cart'}</Button></VStack>}</ModalBody></ModalContent></Modal>
    </Box>
  );
};

export default Shop;
