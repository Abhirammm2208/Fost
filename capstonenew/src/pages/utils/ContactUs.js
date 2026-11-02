import React, { useState } from 'react';
import { Box, Button, Container, Flex, FormControl, FormLabel, Heading, HStack, Input, Text, Textarea, VStack, useToast } from '@chakra-ui/react';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const toast = useToast();
  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Form submitted:', formData);
    toast({ title: 'Message sent', description: 'We’ll get back to you soon.', status: 'success', duration: 3000, isClosable: true });
    setFormData({ name: '', email: '', message: '' });
  };
  return <Box className="app-page"><Container maxW="1100px" px={{ base: 4, md: 6 }} py={{ base: 8, md: 14 }}><Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 8, lg: 16 }} align="start"><Box flex="1"><HStack className="eyebrow" spacing={2}><MessageCircle size={15} /><Text>WE’RE HERE TO HELP</Text></HStack><Heading mt={5} fontSize={{ base: '4xl', md: '6xl' }} lineHeight=".96">Let’s talk<br /><Box as="span" color="brand.500">food & FOST.</Box></Heading><Text mt={6} color="gray.600" fontSize="lg" lineHeight="1.7" maxW="450px">Have a question, suggestion, or a great idea for your local food court? Send us a note and our team will get back to you.</Text><HStack mt={8} spacing={3} bg="moss.50" color="moss.800" p={4} borderRadius="16px" maxW="340px"><Box bg="white" p={2.5} borderRadius="10px"><Mail size={18} /></Box><Box><Text fontSize="xs" color="moss.600" fontWeight="700">CUSTOMER SUPPORT</Text><Text fontWeight="700" fontSize="sm">team@thefost.com</Text></Box></HStack></Box><Box flex="1" w="full" className="soft-card" p={{ base: 5, md: 8 }}><VStack as="form" onSubmit={handleSubmit} spacing={5} align="stretch"><Heading fontSize="xl">Send a message</Heading><FormControl isRequired><FormLabel fontSize="sm">Name</FormLabel><Input name="name" value={formData.name} onChange={handleChange} placeholder="Your name" bg="canvas" borderColor="gray.100" borderRadius="12px" /></FormControl><FormControl isRequired><FormLabel fontSize="sm">Email</FormLabel><Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" bg="canvas" borderColor="gray.100" borderRadius="12px" /></FormControl><FormControl isRequired><FormLabel fontSize="sm">Message</FormLabel><Textarea name="message" value={formData.message} onChange={handleChange} placeholder="How can we help?" rows={6} bg="canvas" borderColor="gray.100" borderRadius="12px" /></FormControl><Button type="submit" colorScheme="brand" size="lg" rightIcon={<ArrowRight size={17} />}>Send message</Button></VStack></Box></Flex></Container></Box>;
};

export default ContactUs;
