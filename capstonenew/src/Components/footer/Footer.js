import React from 'react';
import { Box, Container, Divider, Flex, Heading, HStack, Image, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowUpRight, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import logo from '../../Assets/Fos_t-removebg-preview.png';

const Footer = () => {
  const columns = [
    { title: 'Explore', links: [['Discover food', '/main'], ['How it works', '/HowItWorks'], ['About FOST', '/AboutUs']] },
    { title: 'Support', links: [['Help center', '/helpcenter'], ['Contact us', '/Contactus'], ['Refund policy', '/refund']] },
    { title: 'Legal', links: [['Privacy policy', '/privacypolicy'], ['Terms & conditions', '/termsandconditions']] },
  ];

  return (
    <Box as="footer" mt={{ base: 12, md: 20 }} bg="ink" color="white" position="relative" overflow="hidden">
      <Box position="absolute" w="380px" h="380px" borderRadius="full" bg="brand.600" opacity=".22" right="-130px" top="-180px" />
      <Box position="absolute" w="260px" h="260px" borderRadius="full" bg="sun" opacity=".11" left="-100px" bottom="-150px" />
      <Container maxW="1240px" py={{ base: 12, md: 16 }} position="relative">
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={10}>
          <Box maxW="370px">
            <Image src={logo} alt="FOST" h="52px" w="auto" filter="brightness(0) invert(1)" mb={5} />
            <Text color="whiteAlpha.700" lineHeight="1.8" fontSize="sm">
              Local food, less waiting. FOST connects hungry people with the best food stalls around them, ready for pickup.
            </Text>
            <HStack spacing={2} mt={6}>
              {[
                ['https://x.com/FOST_4', <Twitter size={17} />],
                ['https://www.instagram.com/fost_service/', <Instagram size={17} />],
                ['https://www.youtube.com/@the_fost', <Youtube size={17} />],
                ['https://www.linkedin.com/search/results/all/?keywords=fost&origin=GLOBAL_SEARCH_HEADER&sid=i.V', <Linkedin size={17} />],
              ].map(([href, icon]) => <Link key={href} href={href} isExternal display="grid" placeItems="center" w="38px" h="38px" border="1px solid" borderColor="whiteAlpha.300" borderRadius="full" _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-2px)' }} transition="all .2s">{icon}</Link>)}
            </HStack>
          </Box>
          <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={{ base: 8, md: 14 }}>
            {columns.map((column) => <VStack key={column.title} align="start" spacing={3}>
              <Heading as="h3" fontSize="sm" letterSpacing=".08em" textTransform="uppercase" color="whiteAlpha.600">{column.title}</Heading>
              {column.links.map(([label, path]) => <Link key={path} as={RouterLink} to={path} fontSize="sm" color="whiteAlpha.850" _hover={{ color: 'sun', textDecoration: 'none' }}>{label}</Link>)}
            </VStack>)}
          </SimpleGrid>
        </Flex>
        <Divider my={10} borderColor="whiteAlpha.200" />
        <Flex justify="space-between" align="center" gap={3} direction={{ base: 'column', sm: 'row' }}>
          <Text fontSize="xs" color="whiteAlpha.600">© 2024 FOST. Made for shorter queues.</Text>
          <HStack color="whiteAlpha.600" fontSize="xs"><Text>Pickup only</Text><ArrowUpRight size={14} /></HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
