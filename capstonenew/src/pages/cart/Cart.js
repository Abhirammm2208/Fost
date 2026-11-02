import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Image,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { ArrowLeft, ChevronRight, LockKeyhole, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CouponComponent from '../../Components/coupon/CouponComponent';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedShop, setSelectedShop] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const rebuildGroups = (items) => items.reduce((groups, item) => {
    const shopId = item.shopId || 'shop';
    if (!groups[shopId]) groups[shopId] = { items: [], shopName: item.shopName || 'Food court', shopId, vendorId: item.vendorId, total: 0 };
    groups[shopId].items.push(item);
    groups[shopId].total += Number(item.price || 0) * Number(item.quantity || 1);
    return groups;
  }, {});

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(savedCart);
    setGroupedItems(rebuildGroups(savedCart));
  }, []);

  const syncCart = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
    setGroupedItems(rebuildGroups(items));
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const removeFromCart = (itemId) => syncCart(cartItems.filter((item) => item.id !== itemId));

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    syncCart(cartItems.map((item) => item.id === itemId ? { ...item, quantity } : item));
  };

  const handlePlaceOrder = (shopId, shopData) => {
    setSelectedShop({ id: shopId, ...shopData });
    onOpen();
  };

  const initiatePayUPayment = async (shopData) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    try {
      const response = await fetch('http://localhost:5058/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopData: { ...shopData, items: shopData.items.map((item) => ({ ...item, point: item.point || 0 })), total: shopData.total },
          userData: user,
        }),
      });
      if (!response.ok) throw new Error('Failed to initialize payment');
      const paymentData = await response.json();
      const form = document.createElement('form');
      form.method = 'post';
      form.action = paymentData.payuBaseUrl;
      Object.entries(paymentData).forEach(([key, value]) => {
        if (key === 'payuBaseUrl') return;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      localStorage.removeItem('cart');
      setCartItems([]);
      setGroupedItems({});
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({ title: 'Payment could not be started', description: 'Please check your connection and try again.', status: 'error', duration: 3500, isClosable: true });
    }
  };

  if (cartItems.length === 0) return (
    <Box className="app-page"><Container maxW="1000px" px={{ base: 4, md: 6 }} py={{ base: 12, md: 20 }}><Box className="soft-card" p={{ base: 8, md: 16 }} textAlign="center"><Box display="inline-flex" bg="brand.50" color="brand.500" p={5} borderRadius="full"><ShoppingBag size={30} /></Box><Heading mt={5} fontSize={{ base: '2xl', md: '4xl' }}>Your bag is waiting</Heading><Text mt={3} color="gray.500" maxW="420px" mx="auto">Add something delicious from a local food court and it’ll show up here.</Text><Button mt={7} colorScheme="brand" size="lg" rightIcon={<ChevronRight size={18} />} onClick={() => navigate('/main')}>Explore food courts</Button></Box></Container></Box>
  );

  const CartItem = ({ item }) => (
    <Flex py={4} gap={3} align="center">
      <Image src={item.imageUrl || '/fost . (3).png'} alt={item.name} boxSize={{ base: '70px', md: '84px' }} objectFit="cover" borderRadius="14px" flexShrink={0} />
      <Box flex="1" minW={0}><Text fontWeight="700" noOfLines={1}>{item.name}</Text><Text color="gray.500" fontSize="sm" mt={1}>₹{Number(item.price || 0).toFixed(2)} each</Text><HStack mt={3} spacing={1}><IconButton size="xs" aria-label="Decrease quantity" icon={<Minus size={13} />} onClick={() => updateQuantity(item.id, Number(item.quantity || 1) - 1)} variant="outline" borderRadius="8px" /><Text minW="28px" textAlign="center" fontWeight="700" fontSize="sm">{item.quantity}</Text><IconButton size="xs" aria-label="Increase quantity" icon={<Plus size={13} />} onClick={() => updateQuantity(item.id, Number(item.quantity || 1) + 1)} colorScheme="brand" borderRadius="8px" /></HStack></Box>
      <VStack align="end" spacing={2}><Text fontWeight="800">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</Text><IconButton aria-label={`Remove ${item.name}`} icon={<Trash2 size={15} />} size="xs" variant="ghost" color="gray.400" _hover={{ color: 'red.500', bg: 'red.50' }} onClick={() => removeFromCart(item.id)} /></VStack>
    </Flex>
  );

  return (
    <Box className="app-page"><Container maxW="1240px" px={{ base: 4, md: 6 }} py={{ base: 7, md: 12 }}>
      <Button variant="ghost" size="sm" pl={0} leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/main')} color="gray.600">Continue shopping</Button>
      <Flex mt={5} justify="space-between" align="end" gap={4}><Box><Text className="eyebrow">READY WHEN YOU ARE</Text><Heading mt={2} fontSize={{ base: '3xl', md: '5xl' }}>Your bag</Heading></Box><Text color="gray.500" fontSize="sm">{cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0)} items</Text></Flex>
      <Alert mt={7} status="info" bg="moss.50" color="moss.800" borderRadius="16px" border="1px solid" borderColor="moss.100"><AlertIcon color="moss.600" /><Box><Text fontWeight="700">Pickup made simple</Text><Text fontSize="sm">Each order is prepared at its food court and collected fresh. No delivery wait.</Text></Box></Alert>
      <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1.4fr) minmax(320px, .8fr)' }} gap={{ base: 6, lg: 8 }} mt={7} alignItems="start">
        <GridItem><VStack align="stretch" spacing={5}>{Object.entries(groupedItems).map(([shopId, shopData]) => { const finalTotal = Math.max(0, shopData.total - discountAmount); return <Box key={shopId} className="soft-card" p={{ base: 4, md: 6 }}><Flex justify="space-between" align="center" mb={2}><HStack><Box bg="brand.50" color="brand.600" p={2.5} borderRadius="10px"><ShoppingBag size={17} /></Box><Box><Text className="eyebrow" fontSize="10px">ORDER FROM</Text><Heading mt={1} fontSize="lg">{shopData.shopName}</Heading></Box></HStack><Text color="gray.500" fontSize="sm">{shopData.items.length} item{shopData.items.length > 1 ? 's' : ''}</Text></Flex><Divider my={3} />{shopData.items.map((item) => <React.Fragment key={item.id}><CartItem item={item} /><Divider /></React.Fragment>)}<Box bg="canvas" p={{ base: 4, md: 5 }} mt={4} borderRadius="16px"><CouponComponent total={shopData.total} onCouponApply={(amount) => setDiscountAmount(amount)} /><Flex mt={5} justify="space-between" align={{ base: 'start', sm: 'center' }} gap={4} direction={{ base: 'column', sm: 'row' }}><VStack align="start" spacing={1}><Text color="gray.500" fontSize="sm">Subtotal · ₹{shopData.total.toFixed(2)}</Text>{discountAmount > 0 && <Text color="moss.600" fontSize="sm">Discount · −₹{discountAmount.toFixed(2)}</Text>}<Text fontSize="xl" fontWeight="800">Total · ₹{finalTotal.toFixed(2)}</Text></VStack><Button colorScheme="brand" size="lg" w={{ base: 'full', sm: 'auto' }} rightIcon={<ChevronRight size={18} />} onClick={() => handlePlaceOrder(shopId, { ...shopData, total: finalTotal })}>Place order</Button></Flex></Box></Box>; })}</VStack></GridItem>
        <GridItem position={{ lg: 'sticky' }} top={{ lg: '100px' }}><Box className="soft-card" p={{ base: 5, md: 6 }}><HStack><Box bg="brand.50" color="brand.600" p={2.5} borderRadius="10px"><LockKeyhole size={17} /></Box><Heading fontSize="lg">A secure checkout</Heading></HStack><Text color="gray.500" fontSize="sm" lineHeight="1.7" mt={4}>You’ll be redirected to PayU to complete payment securely. Your order is sent to the stall once payment is confirmed.</Text><Divider my={5} /><VStack align="stretch" spacing={3} fontSize="sm"><HStack justify="space-between"><Text color="gray.500">Food courts</Text><Text fontWeight="700">{Object.keys(groupedItems).length}</Text></HStack><HStack justify="space-between"><Text color="gray.500">Pickup fee</Text><Text color="moss.600" fontWeight="700">Free</Text></HStack></VStack><Button mt={6} w="full" variant="outline" onClick={() => navigate('/main')}>Add more food</Button></Box></GridItem>
      </Grid>
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered><ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" /><ModalContent borderRadius="22px" mx={4}><ModalHeader fontFamily="heading">Confirm your order</ModalHeader><ModalCloseButton /><ModalBody><Stack spacing={5}><Box bg="canvas" p={4} borderRadius="14px"><Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing=".1em">Pickup from</Text><Text fontWeight="800" mt={1}>{selectedShop?.shopName}</Text></Box><Flex justify="space-between" align="center"><Text color="gray.500">Total to pay</Text><Text fontSize="2xl" fontWeight="800" color="brand.600">₹{Number(selectedShop?.total || 0).toFixed(2)}</Text></Flex><Text color="gray.500" fontSize="sm">Your payment will open in a secure PayU window. The stall will start preparing after payment is confirmed.</Text><Button size="lg" colorScheme="brand" onClick={() => initiatePayUPayment(selectedShop)}>Proceed to secure payment</Button></Stack></ModalBody><ModalFooter><Button variant="ghost" onClick={onClose}>Not yet</Button></ModalFooter></ModalContent></Modal>
    </Container></Box>
  );
};

export default Cart;
