import React from 'react';
import { Badge, Box, Button, Flex, Heading, HStack, Image, Text } from '@chakra-ui/react';
import { Leaf, Plus, Star } from 'lucide-react';

const ShopItemCard = ({ item, onAddToCart, onItemClick }) => {
  const isActive = item.isActive !== false;
  const rating = Number(item.averageRating || 4.3);
  const isVeg = item.dietType === 'veg';

  return (
    <Box className="soft-card lift-card" overflow="hidden" opacity={isActive ? 1 : .58} cursor="pointer" onClick={() => onItemClick(item)}>
      <Box h={{ base: '172px', md: '190px' }} position="relative" overflow="hidden">
        <Image src={item.imageUrl || '/fost . (3).png'} alt={item.name} w="full" h="full" objectFit="cover" filter={isActive ? 'none' : 'grayscale(100%)'} transition="transform .4s" />
        <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.600, transparent 58%)" />
        <HStack position="absolute" top={3} left={3} bg="white" px={2} py={1} borderRadius="full" spacing={1} fontSize="xs" color="gray.700"><Box w="8px" h="8px" borderRadius="2px" border="1px solid" borderColor={isVeg ? 'moss.500' : 'red.500'} p="1px"><Box w="full" h="full" borderRadius="1px" bg={isVeg ? 'moss.500' : 'red.500'} /></Box>{isVeg ? 'Veg' : 'Non-veg'}</HStack>
        {!isActive && <Badge position="absolute" top={3} right={3} bg="ink" color="white" borderRadius="full" px={2.5}>Unavailable</Badge>}
        <HStack position="absolute" left={3} bottom={3} bg="white" px={2} py={1} borderRadius="full" spacing={1} fontSize="xs" fontWeight="700"><Star size={12} fill="#f7b928" color="#f7b928" />{rating.toFixed(1)}</HStack>
      </Box>
      <Box p={{ base: 4, md: 5 }}>
        <Flex justify="space-between" align="start" gap={3}><Heading as="h3" fontSize={{ base: 'md', md: 'lg' }} noOfLines={1}>{item.name}</Heading><Text fontWeight="800" color="brand.600" whiteSpace="nowrap">₹{Number(item.price || 0).toFixed(2)}</Text></Flex>
        <Text color="gray.500" fontSize="sm" mt={2} noOfLines={2} minH="40px">{item.description || 'Prepared fresh for pickup.'}</Text>
        <Flex justify="space-between" align="center" mt={4}><HStack color="gray.500" fontSize="xs"><Leaf size={14} color={isVeg ? '#198b5d' : '#8a938c'} /><Text>{isVeg ? 'Vegetarian choice' : 'Made to order'}</Text></HStack><Button size="sm" colorScheme="brand" borderRadius="10px" leftIcon={<Plus size={15} />} isDisabled={!isActive} onClick={(event) => { event.stopPropagation(); onAddToCart(item); }}>{isActive ? 'Add' : 'Sold out'}</Button></Flex>
      </Box>
    </Box>
  );
};

export default ShopItemCard;
