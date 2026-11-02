import React, { useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { MdEmail, MdLock } from 'react-icons/md';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { auth, firestore } from '../../Components/firebase/Firebase';
import foodImage from '../../Assets/WhatsApp Image 2024-11-20 at 9.59.19 PM.jpeg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (method) => {
    setIsLoading(true);
    setLoginError('');
    try {
      let userCredential;
      if (method === 'email') {
        if (!email || !password) {
          setLoginError('Enter your email and password to continue.');
          setIsLoading(false);
          return;
        }
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithPopup(auth, new GoogleAuthProvider());
      }

      const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
      const userData = userDoc.exists() ? userDoc.data() : { email: userCredential.user.email, role: 'customer' };
      localStorage.setItem('user', JSON.stringify({ uid: userCredential.user.uid, email: userCredential.user.email, role: userData.role, shopId: userData.shopId || null }));
      toast({ title: 'Welcome back', description: 'You are signed in and ready to order.', status: 'success', duration: 2500, isClosable: true });
      if (userData.role === 'admin') navigate('/admin/shops');
      else if (userData.role === 'vendor') navigate('/vendor/items');
      else navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      const message = error.code === 'auth/invalid-credential' ? 'That email or password is not correct.' : 'We could not sign you in. Please try again.';
      setLoginError(message);
      toast({ title: 'Sign in failed', description: message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="calc(100vh - 84px)" bg="canvas" p={{ base: 0, md: 5, lg: 8 }} align="center">
      <Box maxW="1160px" w="full" mx="auto" bg="white" border="1px solid" borderColor="gray.100" borderRadius={{ base: 0, md: '28px' }} overflow="hidden" boxShadow={{ base: 'none', md: '0 24px 70px rgba(24,35,29,.10)' }}>
        <Flex direction={{ base: 'column', lg: 'row' }} minH={{ base: 'auto', lg: '650px' }}>
          <Box flex="1" minH={{ base: '250px', lg: 'auto' }} position="relative" overflow="hidden" bg="ink"><Box position="absolute" inset={0} bgImage={`url("${foodImage}")`} bgSize="cover" bgPosition="center" opacity=".72" /><Box position="absolute" inset={0} bgGradient="linear(to-t, rgba(8,20,14,.92), rgba(8,20,14,.08))" /><VStack position="relative" h="full" align="start" justify="end" color="white" p={{ base: 7, md: 10 }} spacing={4}><HStack color="sun" fontSize="xs" fontWeight="800" letterSpacing=".12em"><Sparkles size={15} /> WELCOME TO FOST</HStack><Heading fontSize={{ base: '3xl', md: '5xl' }} lineHeight=".98">Your next<br /><Box as="span" color="sun">great meal</Box><br />starts here.</Heading><Text color="whiteAlpha.800" maxW="360px" lineHeight="1.7">Order ahead from local stalls and spend less time waiting for the food you love.</Text><HStack spacing={4} fontSize="sm" color="whiteAlpha.800"><HStack><Check size={15} color="#ffd166" /><Text>Pickup fresh</Text></HStack><HStack><Check size={15} color="#ffd166" /><Text>Skip the queue</Text></HStack></HStack></VStack></Box>
          <Flex flex="1" align="center" justify="center" p={{ base: 7, md: 10, lg: 14 }}><Container maxW="420px" p={0}><VStack align="stretch" spacing={6}><Box><Text className="eyebrow">GOOD TO SEE YOU</Text><Heading mt={3} fontSize={{ base: '3xl', md: '4xl' }}>Sign in</Heading><Text mt={2} color="gray.500">Don’t have an account? <Link color="brand.600" fontWeight="700" onClick={() => navigate('/register')}>Join FOST <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /></Link></Text></Box>{loginError && <Alert status="error" borderRadius="12px"><AlertIcon /><AlertDescription>{loginError}</AlertDescription></Alert>}<VStack as="form" spacing={4} onSubmit={(event) => { event.preventDefault(); handleSignIn('email'); }}><FormControl><InputGroup size="lg"><InputLeftElement pointerEvents="none"><Icon as={MdEmail} color="gray.400" /></InputLeftElement><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" borderRadius="12px" bg="canvas" borderColor="gray.100" /></InputGroup></FormControl><FormControl><InputGroup size="lg"><InputLeftElement pointerEvents="none"><Icon as={MdLock} color="gray.400" /></InputLeftElement><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" borderRadius="12px" bg="canvas" borderColor="gray.100" /></InputGroup></FormControl><Flex w="full" justify="end"><Link fontSize="sm" color="brand.600" fontWeight="600" onClick={() => navigate('/reset-password')}>Forgot password?</Link></Flex><Button type="submit" w="full" size="lg" colorScheme="brand" isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>Sign in</Button></VStack><HStack><Divider /><Text color="gray.400" fontSize="sm" whiteSpace="nowrap">or continue with</Text><Divider /></HStack><Button size="lg" variant="outline" w="full" borderRadius="12px" borderColor="gray.200" leftIcon={<Icon as={FcGoogle} boxSize={5} />} onClick={() => handleSignIn('google')} isLoading={isLoading}>Google</Button><Text color="gray.400" fontSize="xs" textAlign="center" lineHeight="1.6">By signing in, you agree to our <Link color="brand.600" onClick={() => navigate('/termsandconditions')}>Terms</Link> and <Link color="brand.600" onClick={() => navigate('/privacypolicy')}>Privacy Policy</Link>.</Text></VStack></Container></Flex>
        </Flex>
      </Box>
    </Flex>
  );
};

export default Login;
