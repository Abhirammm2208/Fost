import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Container, Flex, Grid, HStack, Heading, Image, Input, InputGroup, InputLeftElement, Skeleton, Text, VStack, useToast } from '@chakra-ui/react';
import { collection, getDocs } from 'firebase/firestore';
import { Minus, Plus, Search, ShoppingBasket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../../Components/firebase/Firebase';

const GroceryPage = () => {
  const [groceries, setGroceries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'itemsGroceries'));
        setGroceries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch (error) {
        console.error('Detailed error fetching groceries:', error);
        toast({ title: 'Could not load groceries', description: error.message, status: 'error', duration: 4000, isClosable: true });
      } finally { setLoading(false); }
    };
    fetchGroceries();
    setCartItems(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, [toast]);

  const updateCart = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const addToCart = (item) => {
    const next = [...cartItems];
    const index = next.findIndex((cartItem) => cartItem.id === item.id);
    if (index >= 0) next[index].quantity = Number(next[index].quantity || 1) + 1;
    else next.push({ ...item, quantity: 1, shopId: item.shopId || 'grocery-store', shopName: item.shopName || 'Grocery Store', category: item.category || 'grocery', dietType: item.dietType || 'all' });
    updateCart(next);
    toast({ title: 'Added to cart', description: `${item.name} added to your bag.`, status: 'success', duration: 1600, isClosable: true });
  };

  const removeFromCart = (item) => {
    const next = [...cartItems];
    const index = next.findIndex((cartItem) => cartItem.id === item.id);
    if (index < 0) return;
    if (Number(next[index].quantity || 1) > 1) next[index].quantity -= 1;
    else next.splice(index, 1);
    updateCart(next);
  };

  const filteredGroceries = useMemo(() => groceries.filter((item) => !searchTerm || item.name?.toLowerCase().includes(searchTerm.toLowerCase())), [groceries, searchTerm]);
  const quantity = (id) => cartItems.find((item) => item.id === id)?.quantity || 0;

  return <Box className="app-page"><Container maxW="1240px" px={{ base: 4, md: 6 }} py={{ base: 7, md: 12 }}><Flex justify="space-between" align={{ base: 'start', md: 'end' }} gap={5} direction={{ base: 'column', md: 'row' }}><Box><Text className="eyebrow">FOST PANTRY</Text><Heading mt={3} fontSize={{ base: '3xl', md: '5xl' }}>Everyday essentials,<br /><Box as="span" color="brand.500">made easy.</Box></Heading><Text color="gray.500" mt={3}>Pick up your groceries with the same simple FOST flow.</Text></Box><Button colorScheme="brand" variant="outline" leftIcon={<ShoppingBasket size={17} />} onClick={() => navigate('/cart')}>View bag · {cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0)}</Button></Flex><InputGroup mt={9} maxW="650px" size="lg"><InputLeftElement><Search size={19} color="#8a938c" /></InputLeftElement><Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search groceries" bg="white" borderColor="gray.100" borderRadius="14px" /></InputGroup><Grid mt={9} templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={{ base: 3, md: 5 }}>{loading ? Array.from({ length: 10 }).map((_, index) => <Box key={index} className="soft-card" p={3}><Skeleton h="130px" borderRadius="12px" /><Skeleton mt={3} h="16px" /><Skeleton mt={2} h="14px" w="60%" /></Box>) : filteredGroceries.map((item) => { const itemQuantity = quantity(item.id); return <Box key={item.id} className="soft-card lift-card" p={3} overflow="hidden"><Box h={{ base: '112px', md: '150px' }} bg="canvas" borderRadius="12px" overflow="hidden" position="relative"><Image src={item.imageUrl} alt={item.name} w="full" h="full" objectFit="contain" /><>{item.discount > 0 && <Badge position="absolute" top={2} left={2} colorScheme="brand" borderRadius="full">{item.discount}% off</Badge>}</></Box><Text mt={3} fontWeight="700" fontSize="sm" noOfLines={2} minH="40px">{item.name}</Text><Flex justify="space-between" align="end" mt={2}><VStack align="start" spacing={0}><Text fontWeight="800" color="brand.600">₹{item.price}</Text><Text fontSize="xs" color="gray.500">{item.weight || 'Pack'}</Text></VStack>{itemQuantity === 0 ? <Button size="sm" colorScheme="brand" borderRadius="9px" onClick={() => addToCart(item)} leftIcon={<Plus size={13} />}>Add</Button> : <HStack spacing={1} border="1px solid" borderColor="brand.200" borderRadius="9px" p="2px"><Button size="xs" variant="ghost" color="brand.600" onClick={() => removeFromCart(item)}><Minus size={13} /></Button><Text fontSize="sm" fontWeight="700" minW="18px" textAlign="center">{itemQuantity}</Text><Button size="xs" variant="ghost" color="brand.600" onClick={() => addToCart(item)}><Plus size={13} /></Button></HStack>}</Flex></Box>; })}</Grid>{!loading && filteredGroceries.length === 0 && <Box className="soft-card" mt={8} p={10} textAlign="center"><Text color="gray.500">No groceries match that search.</Text></Box>}</Container></Box>;
};

export default GroceryPage;
