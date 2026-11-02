import React from 'react';
import { Box, Button, Container, Flex, Heading, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { ArrowRight, BellRing, Check, ClipboardList, CookingPot, QrCode, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HowItWorks = () => {
  const navigate = useNavigate();
  const steps = [
    { number: '01', title: 'Choose a stall', description: 'Browse nearby food courts and find something that makes you hungry.', icon: Smartphone },
    { number: '02', title: 'Build your order', description: 'Pick your items, review your bag, and pay securely in a few taps.', icon: ClipboardList },
    { number: '03', title: 'Watch it cook', description: 'Follow your order as the stall accepts it and gets it ready.', icon: CookingPot },
    { number: '04', title: 'Collect and enjoy', description: 'Get your pickup code, skip the queue, and take your meal fresh.', icon: QrCode },
  ];
  return <Box className="app-page"><Container maxW="1240px" px={{ base: 4, md: 6 }} py={{ base: 8, md: 14 }}><Box bg="ink" color="white" borderRadius="26px" p={{ base: 7, md: 12 }} overflow="hidden" position="relative"><Box position="absolute" w="300px" h="300px" bg="brand.600" borderRadius="full" opacity=".5" right="-110px" top="-150px" /><Box position="relative" maxW="720px"><HStack className="eyebrow" color="sun" spacing={2}><BellRing size={15} /><Text>THE SIMPLE WAY TO EAT</Text></HStack><Heading mt={5} fontSize={{ base: '4xl', md: '6xl' }} lineHeight=".96">Order less.<br />Enjoy more.</Heading><Text mt={5} color="whiteAlpha.750" fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.7" maxW="580px">FOST keeps the whole pickup journey clear, from finding a stall to receiving that first bite.</Text></Box></Box><Box mt={{ base: 12, md: 18 }}><Flex justify="space-between" align="end"><Box><Text className="eyebrow">FOUR EASY STEPS</Text><Heading mt={2} fontSize={{ base: '2xl', md: '4xl' }}>From browse to bite.</Heading></Box><Check size={35} color="#198b5d" /></Flex><SimpleGrid mt={8} columns={{ base: 1, sm: 2, lg: 4 }} spacing={5}>{steps.map((step) => { const StepIcon = step.icon; return <Box key={step.number} className="soft-card lift-card" p={{ base: 5, md: 6 }}><Flex justify="space-between" align="start"><Text fontFamily="heading" fontSize="3xl" fontWeight="700" color="brand.500">{step.number}</Text><Box bg="moss.50" color="moss.600" p={3} borderRadius="12px"><StepIcon size={21} /></Box></Flex><Heading mt={8} fontSize="lg">{step.title}</Heading><Text mt={2} color="gray.500" fontSize="sm" lineHeight="1.7">{step.description}</Text></Box>; })}</SimpleGrid></Box><Flex mt={{ base: 12, md: 18 }} direction={{ base: 'column', md: 'row' }} gap={6} align="center" bg="brand.50" border="1px solid" borderColor="brand.100" borderRadius="22px" p={{ base: 6, md: 8 }}><Box flex="1"><Text className="eyebrow">WHY PICKUP?</Text><Heading mt={2} fontSize={{ base: 'xl', md: '2xl' }}>The food arrives when you do.</Heading><Text mt={2} color="gray.600" fontSize="sm" lineHeight="1.7">No delivery detours, no mystery ETAs. Your local stall prepares your order for a clean, fresh pickup.</Text></Box><Button colorScheme="brand" onClick={() => navigate('/main')} rightIcon={<ArrowRight size={17} />}>Find food nearby</Button></Flex></Container></Box>;
};

export default HowItWorks;
