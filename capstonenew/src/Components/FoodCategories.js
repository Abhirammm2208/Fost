import React from 'react';
import { Box, Container, Flex, Heading, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { ArrowUpRight, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FOOD_CATEGORIES = [
  { title: 'Food courts', description: 'Browse local stalls and order ahead', color: 'brand.500', bg: 'brand.50', route: '/main' },
];

const FoodCategories = () => {
  const navigate = useNavigate();
  return (
    <Container maxW="full" p={0}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {FOOD_CATEGORIES.map((category) => <Flex key={category.title} className="soft-card lift-card" align="center" gap={4} p={{ base: 4, md: 5 }} cursor="pointer" onClick={() => navigate(category.route)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && navigate(category.route)}>
          <Box bg={category.bg} color={category.color} p={4} borderRadius="16px"><Icon as={Utensils} boxSize={6} /></Box>
          <Box flex="1"><Heading fontSize={{ base: 'md', md: 'lg' }}>{category.title}</Heading><Text color="gray.500" fontSize="sm" mt={1}>{category.description}</Text></Box>
          <Box color="moss.600"><ArrowUpRight size={21} /></Box>
        </Flex>)}
      </SimpleGrid>
    </Container>
  );
};

export default FoodCategories;
