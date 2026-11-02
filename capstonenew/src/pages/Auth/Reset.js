import React, { useState } from 'react';
import { Alert, AlertDescription, AlertIcon, Box, Button, Container, Flex, FormControl, Heading, Input, Link, Text, VStack, useToast } from '@chakra-ui/react';
import { ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../Components/firebase/Firebase';

const Reset = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true); setResetError(''); setResetSuccess('');
    try {
      if (!email) throw new Error('Enter your email address.');
      await sendPasswordResetEmail(auth, email);
      setResetSuccess('Password reset link sent. Check your inbox.');
      toast({ title: 'Reset link sent', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      const messages = { 'auth/invalid-email': 'Enter a valid email address.', 'auth/user-not-found': 'No account found with this email.', 'auth/too-many-requests': 'Too many attempts. Try again later.' };
      setResetError(messages[error.code] || error.message || 'Could not send the reset link.');
    } finally { setIsLoading(false); }
  };
  return <Flex minH="calc(100vh - 84px)" align="center" bg="canvas" p={{ base: 4, md: 8 }}><Container maxW="520px"><Box className="soft-card" p={{ base: 6, md: 10 }}><Box bg="brand.50" color="brand.600" p={3} borderRadius="14px" display="inline-flex"><KeyRound size={22} /></Box><Heading mt={6} fontSize={{ base: '3xl', md: '4xl' }}>Reset your password</Heading><Text mt={3} color="gray.500" lineHeight="1.7">Enter the email linked to your FOST account and we’ll send you a fresh sign-in link.</Text>{resetError && <Alert mt={6} status="error" borderRadius="12px"><AlertIcon /><AlertDescription>{resetError}</AlertDescription></Alert>}{resetSuccess && <Alert mt={6} status="success" borderRadius="12px"><AlertIcon /><AlertDescription>{resetSuccess}</AlertDescription></Alert>}<VStack as="form" onSubmit={handleResetPassword} mt={7} spacing={4} align="stretch"><FormControl><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" size="lg" bg="canvas" borderColor="gray.100" borderRadius="12px" required /></FormControl><Button type="submit" size="lg" colorScheme="brand" isLoading={isLoading} rightIcon={<ArrowRight size={17} />}>Send reset link</Button></VStack><Button mt={5} variant="ghost" color="gray.600" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/login')}>Back to sign in</Button></Box><Text textAlign="center" mt={5} fontSize="sm" color="gray.500">Need help? <Link color="brand.600" onClick={() => navigate('/Contactus')}>Contact the FOST team.</Link></Text></Container></Flex>;
};

export default Reset;
