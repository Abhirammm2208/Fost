import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { ArrowRight, Award, Clock3, Search, SlidersHorizontal, Star, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { app } from '../../Components/firebase/Firebase';

const ShopCard = ({ shop }) => {
  const rating = Number(shop.rating || 4.2);
  const cuisines = shop.cuisines || ['Local favourites', 'Freshly made'];
  const deliveryTime = shop.deliveryTime || shop.estimatedDeliveryTime || '15-25';
  const isOpen = shop.isOpen !== false;

  return (
    <Box
      as={isOpen ? Link : 'article'}
      to={isOpen ? `/shop/${shop.id}` : undefined}
      className="soft-card lift-card"
      overflow="hidden"
      opacity={isOpen ? 1 : .68}
      cursor={isOpen ? 'pointer' : 'not-allowed'}
      textDecoration="none"
    >
      <Box h={{ base: '170px', md: '214px' }} position="relative" overflow="hidden">
        <Image src={shop.imageUrl} alt={shop.name} w="full" h="full" objectFit="cover" filter={isOpen ? 'none' : 'grayscale(100%)'} transition="transform .4s" />
        <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.700, transparent 58%)" />
        {shop.promoted && <Badge position="absolute" top={3} left={3} bg="sun" color="ink" borderRadius="full" px={2.5} py={1}><HStack spacing={1}><Award size={12} /><Text>Featured</Text></HStack></Badge>}
        {shop.discount && <Badge position="absolute" bottom={3} left={3} bg="moss.600" color="white" borderRadius="full" px={2.5} py={1}>{shop.discount}</Badge>}
        {!isOpen && <Badge position="absolute" top={3} right={3} bg="ink" color="white" borderRadius="full" px={2.5} py={1}>Closed</Badge>}
      </Box>
      <Box p={{ base: 4, md: 5 }}>
        <Flex align="center" justify="space-between" gap={3}>
          <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }} noOfLines={1}>{shop.name || 'Food court'}</Heading>
          <HStack bg="moss.50" color="moss.700" px={2} py={1} borderRadius="full" spacing={1} fontSize="xs" fontWeight="700"><Star size={12} fill="currentColor" />{rating.toFixed(1)}</HStack>
        </Flex>
        <HStack mt={2} color="gray.500" fontSize="sm" spacing={1.5} flexWrap="wrap">
          {cuisines.slice(0, 2).map((cuisine, index) => <React.Fragment key={cuisine}><Text>{cuisine}</Text>{index < Math.min(cuisines.length, 2) - 1 && <Text color="gray.300">•</Text>}</React.Fragment>)}
        </HStack>
        <HStack mt={4} color="gray.500" fontSize="xs" spacing={4}><HStack spacing={1}><Clock3 size={14} color="#f26a3d" /><Text>{deliveryTime} mins</Text></HStack><Text>Pickup available</Text></HStack>
        {isOpen && <Text mt={4} color="moss.600" fontSize="xs" fontWeight="800" letterSpacing=".08em">VIEW MENU <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /></Text>}
      </Box>
    </Box>
  );
};

const Main = () => {
  const firestore = getFirestore(app);
  const toast = useToast();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'shops'));
        setShops(snapshot.docs.map((shop) => ({ id: shop.id, ...shop.data() })));
      } catch (fetchError) {
        console.error('Error fetching shops:', fetchError);
        setError('We could not load the food courts right now. Please try again.');
        toast({ title: 'Could not load food courts', status: 'error', duration: 3000, isClosable: true });
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [firestore, toast]);

  const filteredShops = useMemo(() => shops
    .filter((shop) => {
      const term = searchTerm.trim().toLowerCase();
      return !term || shop.name?.toLowerCase().includes(term) || shop.cuisines?.some((cuisine) => cuisine.toLowerCase().includes(term));
    })
    .sort((first, second) => {
      if (sortBy === 'deliveryTime') return parseInt(first.deliveryTime || first.estimatedDeliveryTime || 30, 10) - parseInt(second.deliveryTime || second.estimatedDeliveryTime || 30, 10);
      if (sortBy === 'name') return (first.name || '').localeCompare(second.name || '');
      return Number(second.rating || 0) - Number(first.rating || 0);
    }), [searchTerm, shops, sortBy]);

  if (loading) return <Flex minH="70vh" align="center" justify="center" bg="canvas"><Spinner size="xl" color="brand.500" thickness="4px" /></Flex>;

  return (
    <Box className="app-page">
      <Container maxW="1240px" px={{ base: 4, md: 6 }} py={{ base: 8, md: 14 }}>
        <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align={{ base: 'start', lg: 'end' }} gap={6}>
          <Box maxW="650px"><HStack className="eyebrow" spacing={2}><Box w="8px" h="8px" bg="brand.500" borderRadius="full" /><Text>THE FOST FOOD MAP</Text></HStack><Heading mt={4} fontSize={{ base: '4xl', md: '6xl' }} lineHeight=".98">Find your next<br /><Box as="span" color="brand.500">favourite bite.</Box></Heading><Text mt={5} color="gray.600" fontSize={{ base: 'md', md: 'lg' }} maxW="530px" lineHeight="1.7">Explore the stalls around you, see what’s cooking, and order ahead for a smoother pickup.</Text></Box>
          <HStack bg="moss.50" color="moss.700" borderRadius="14px" px={4} py={3} spacing={3}><Box bg="white" p={2} borderRadius="10px"><Utensils size={18} /></Box><Box><Text fontWeight="700" fontSize="sm">Pickup, not delivery</Text><Text fontSize="xs" color="moss.600">Fresh food, shorter waits.</Text></Box></HStack>
        </Flex>

        <Flex mt={{ base: 8, md: 12 }} p={{ base: 3, md: 4 }} bg="white" border="1px solid" borderColor="gray.100" borderRadius="18px" gap={3} direction={{ base: 'column', md: 'row' }} shadow="sm">
          <InputGroup size="lg" flex="1"><InputLeftElement pointerEvents="none"><Search size={19} color="#8a938c" /></InputLeftElement><Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search stalls, cuisines, or cravings" bg="canvas" border="none" borderRadius="12px" _focus={{ boxShadow: '0 0 0 2px var(--chakra-colors-brand-100)' }} /></InputGroup>
          <HStack><HStack px={3} color="gray.500" fontSize="sm" display={{ base: 'none', md: 'flex' }}><SlidersHorizontal size={16} /><Text>Sort</Text></HStack><Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} size="lg" bg="canvas" border="none" borderRadius="12px" w={{ base: 'full', md: '220px' }}><option value="rating">Top rated</option><option value="deliveryTime">Fastest pickup</option><option value="name">Name A–Z</option></Select></HStack>
        </Flex>

        <Flex mt={10} mb={5} justify="space-between" align="end"><Box><Text className="eyebrow">{filteredShops.length} PLACES TO EAT</Text><Heading mt={2} fontSize={{ base: '2xl', md: '3xl' }}>Food courts near you</Heading></Box>{searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} color="brand.600">Clear search</Button>}</Flex>
        {error ? <Box className="soft-card" p={8} textAlign="center"><Text color="red.500">{error}</Text></Box> : filteredShops.length ? <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>{filteredShops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}</SimpleGrid> : <Box className="soft-card" p={{ base: 8, md: 14 }} textAlign="center"><Box bg="brand.50" color="brand.500" p={4} borderRadius="full" display="inline-flex"><Search size={24} /></Box><Heading mt={4} fontSize="xl">No food courts found</Heading><Text mt={2} color="gray.500">Try a different search, or browse every stall.</Text><Button mt={5} colorScheme="brand" onClick={() => { setSearchTerm(''); setSortBy('rating'); }}>Reset filters</Button></Box>}
      </Container>
    </Box>
  );
};

export default Main;
