import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { MdEmail, MdLock, MdPerson, MdStore } from 'react-icons/md';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { auth, firestore } from '../../Components/firebase/Firebase';
import { createLogger } from '../utils/ErrorLoggers';
import foodImage from '../../Assets/WhatsApp Image 2024-11-20 at 10.00.18 PM.jpeg';

const Register = () => {
  const logger = useMemo(() => createLogger('RegisterComponent'), []);
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [shopId, setShopId] = useState('');
  const [availableShops, setAvailableShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [restrictions, setRestrictions] = useState({ adminExists: false, takenShops: new Set() });
  const [verificationStatus, setVerificationStatus] = useState({ isVerifying: false, message: '' });
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationTimer, setVerificationTimer] = useState(0);
  const [tempUser, setTempUser] = useState(null);
  const [verificationCheckInterval, setVerificationCheckInterval] = useState(null);

  useEffect(() => {
    const loadRegistrationData = async () => {
      try {
        const adminSnapshot = await getDocs(query(collection(firestore, 'users'), where('role', '==', 'admin')));
        const vendorSnapshot = await getDocs(query(collection(firestore, 'users'), where('role', '==', 'vendor')));
        const takenShops = new Set();
        vendorSnapshot.forEach((vendor) => { if (vendor.data().shopId) takenShops.add(vendor.data().shopId); });
        setRestrictions({ adminExists: !adminSnapshot.empty, takenShops });
        const shopsSnapshot = await getDocs(collection(firestore, 'shops'));
        setAvailableShops(shopsSnapshot.docs.map((shop) => ({ id: shop.id, ...shop.data() })).filter((shop) => !takenShops.has(shop.id)));
      } catch (error) {
        logger.error(error, { action: 'loadRegistrationData', component: 'Register' });
        toast({ title: 'Could not load registration options', status: 'error', duration: 4000, isClosable: true });
      }
    };
    loadRegistrationData();
  }, [logger, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.emailVerified) await signOut(auth);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => () => {
    if (verificationCheckInterval) clearInterval(verificationCheckInterval);
  }, [verificationCheckInterval]);

  const handleRedirect = (userRole) => {
    if (userRole === 'admin') navigate('/admin/shops');
    else if (userRole === 'vendor') navigate('/vendor/items');
    else navigate('/');
  };

  const completeRegistration = async (user) => {
    try {
      const existingUser = await getDoc(doc(firestore, 'users', user.uid));
      if (!existingUser.exists()) await setDoc(doc(firestore, 'users', user.uid), { email: user.email, role, shopId: role === 'vendor' ? shopId : null, createdAt: new Date() });
      setIsVerificationModalOpen(false);
      toast({ title: 'Account created', description: 'Welcome to FOST.', status: 'success', duration: 3000, isClosable: true });
      handleRedirect(role);
    } catch (error) {
      logger.error(error, { action: 'completeRegistration', userId: user.uid, role });
      toast({ title: 'Registration could not be completed', status: 'error', duration: 3500, isClosable: true });
    }
  };

  const handleVerificationTimeout = async (user) => {
    try {
      if (user) {
        try { await deleteDoc(doc(firestore, 'users', user.uid)); } catch (error) { logger.error(error, { action: 'deletePendingUser' }); }
        try { await user.delete(); } catch (error) { await signOut(auth); }
      }
      setIsVerificationModalOpen(false);
      setVerificationStatus({ isVerifying: false, message: 'Verification timed out. Please try again.' });
      toast({ title: 'Verification timed out', status: 'error', duration: 4000, isClosable: true });
    } catch (error) { logger.error(error, { action: 'handleVerificationTimeout' }); }
  };

  const checkVerificationStatus = async (user, interval) => {
    try {
      await user.reload();
      if (!user.emailVerified) return;
      clearInterval(interval);
      setVerificationStatus({ isVerifying: false, message: 'Email verified successfully.' });
      await signInWithEmailAndPassword(auth, user.email, tempUser.password);
      await completeRegistration(user);
      setTempUser(null);
    } catch (error) {
      logger.error(error, { action: 'checkVerificationStatus', userId: user?.uid });
      toast({ title: 'Verification check failed', description: 'Please try again from your email.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const startVerificationCheck = (user) => {
    setVerificationTimer(300);
    setVerificationStatus({ isVerifying: true, message: 'Waiting for email verification…' });
    const interval = setInterval(() => {
      setVerificationTimer((time) => {
        if (time <= 1) {
          clearInterval(interval);
          handleVerificationTimeout(user);
          return 0;
        }
        if (time % 2 === 0) checkVerificationStatus(user, interval);
        return time - 1;
      });
    }, 1000);
    setVerificationCheckInterval(interval);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setIsLoading(true);
    try {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
      }
      if (role === 'admin' && restrictions.adminExists) throw new Error('An admin account already exists.');
      if (role === 'vendor' && (!shopId || restrictions.takenShops.has(shopId))) throw new Error('Please select an available shop.');
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.includes(GoogleAuthProvider.PROVIDER_ID)) {
        toast({ title: 'Google account detected', description: 'Use Google to continue with this email.', status: 'info', duration: 4000, isClosable: true });
        return;
      }
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await signOut(auth);
      setTempUser({ ...user, password });
      await sendEmailVerification(user);
      setIsVerificationModalOpen(true);
      startVerificationCheck(user);
    } catch (error) {
      logger.error(error, { action: 'register', email, role });
      const messages = { 'auth/email-already-in-use': 'This email is already registered.', 'auth/invalid-email': 'Enter a valid email address.', 'auth/weak-password': 'Password should be at least 6 characters.', 'auth/network-request-failed': 'Check your network connection.' };
      toast({ title: 'Registration failed', description: messages[error.code] || error.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      if (!result.user.emailVerified) { await signOut(auth); throw new Error('Please verify your Google email before continuing.'); }
      await completeRegistration(result.user);
    } catch (error) {
      logger.error(error, { action: 'googleSignIn' });
      toast({ title: 'Google sign in failed', description: error.message, status: 'error', duration: 4000, isClosable: true });
    } finally { setIsLoading(false); }
  };

  const resendVerificationEmail = async () => {
    if (!tempUser) return;
    try { await sendEmailVerification(tempUser); toast({ title: 'Verification email sent', status: 'success', duration: 2500, isClosable: true }); }
    catch (error) { toast({ title: 'Could not resend email', description: error.message, status: 'error', duration: 3500, isClosable: true }); }
  };

  const closeVerificationModal = () => {
    if (verificationCheckInterval) clearInterval(verificationCheckInterval);
    setVerificationCheckInterval(null);
    setIsVerificationModalOpen(false);
    toast({ title: 'Verification still pending', description: 'You can continue from the email we sent you.', status: 'info', duration: 4000, isClosable: true });
  };

  return (
    <Flex minH="calc(100vh - 84px)" bg="canvas" p={{ base: 0, md: 5, lg: 8 }} align="center">
      <Box maxW="1160px" w="full" mx="auto" bg="white" border="1px solid" borderColor="gray.100" borderRadius={{ base: 0, md: '28px' }} overflow="hidden" boxShadow={{ base: 'none', md: '0 24px 70px rgba(24,35,29,.10)' }}>
        <Flex direction={{ base: 'column', lg: 'row' }} minH={{ base: 'auto', lg: '690px' }}>
          <Box flex="1" minH={{ base: '240px', lg: 'auto' }} position="relative" overflow="hidden" bg="moss.800"><Box position="absolute" inset={0} bgImage={`url("${foodImage}")`} bgSize="cover" bgPosition="center" opacity=".62" /><Box position="absolute" inset={0} bgGradient="linear(to-t, rgba(8,20,14,.94), rgba(8,20,14,.1))" /><VStack position="relative" h="full" align="start" justify="end" color="white" p={{ base: 7, md: 10 }} spacing={4}><HStack color="sun" fontSize="xs" fontWeight="800" letterSpacing=".12em"><Sparkles size={15} /> JOIN THE FOST TABLE</HStack><Heading fontSize={{ base: '3xl', md: '5xl' }} lineHeight=".98">More flavour,<br /><Box as="span" color="sun">less waiting.</Box></Heading><Text color="whiteAlpha.800" maxW="360px" lineHeight="1.7">Make food court pickups feel effortless, from your first order to your hundredth.</Text><HStack spacing={4} fontSize="sm" color="whiteAlpha.800"><HStack><Check size={15} color="#ffd166" /><Text>Free to join</Text></HStack><HStack><Check size={15} color="#ffd166" /><Text>Local favourites</Text></HStack></HStack></VStack></Box>
          <Flex flex="1" align="center" justify="center" p={{ base: 7, md: 10, lg: 14 }}><Container maxW="440px" p={0}><VStack as="form" onSubmit={handleRegister} align="stretch" spacing={5}><Box><Text className="eyebrow">MAKE IT OFFICIAL</Text><Heading mt={3} fontSize={{ base: '3xl', md: '4xl' }}>Create account</Heading><Text mt={2} color="gray.500">Already have an account? <Link color="brand.600" fontWeight="700" onClick={() => navigate('/login')}>Sign in <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /></Link></Text></Box><Button size="lg" variant="outline" borderRadius="12px" borderColor="gray.200" leftIcon={<Icon as={FcGoogle} boxSize={5} />} onClick={handleGoogleSignIn} isLoading={isLoading}>Continue with Google</Button><HStack><Divider /><Text fontSize="sm" color="gray.400" whiteSpace="nowrap">or use email</Text><Divider /></HStack><VStack spacing={3} align="stretch"><FormControl><InputGroup size="lg"><InputLeftElement pointerEvents="none"><Icon as={MdEmail} color="gray.400" /></InputLeftElement><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required bg="canvas" borderColor="gray.100" borderRadius="12px" /></InputGroup></FormControl><FormControl isInvalid={!!passwordError}><InputGroup size="lg"><InputLeftElement pointerEvents="none"><Icon as={MdLock} color="gray.400" /></InputLeftElement><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required bg="canvas" borderColor="gray.100" borderRadius="12px" /></InputGroup></FormControl><FormControl isInvalid={!!passwordError}><InputGroup size="lg"><InputLeftElement pointerEvents="none"><Icon as={MdLock} color="gray.400" /></InputLeftElement><Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" required bg="canvas" borderColor="gray.100" borderRadius="12px" /></InputGroup><FormErrorMessage>{passwordError}</FormErrorMessage></FormControl><FormControl><Select size="lg" value={role} onChange={(event) => setRole(event.target.value)} bg="canvas" borderColor="gray.100" borderRadius="12px" icon={<MdPerson />}><option value="customer">I’m ordering food</option>{!restrictions.adminExists && <option value="admin">I’m an admin</option>}{availableShops.length > 0 && <option value="vendor">I run a food stall</option>}</Select></FormControl>{role === 'vendor' && <FormControl><Select size="lg" value={shopId} onChange={(event) => setShopId(event.target.value)} placeholder="Choose your food stall" required bg="canvas" borderColor="gray.100" borderRadius="12px" icon={<MdStore />}>{availableShops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</Select></FormControl>}<Button type="submit" size="lg" colorScheme="brand" isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>Create account</Button></VStack><Text fontSize="xs" color="gray.400" textAlign="center" lineHeight="1.6">By joining, you agree to our <Link color="brand.600" onClick={() => navigate('/termsandconditions')}>Terms</Link> and <Link color="brand.600" onClick={() => navigate('/privacypolicy')}>Privacy Policy</Link>.</Text></VStack></Container></Flex>
        </Flex>
      </Box>
      {verificationStatus.isVerifying && <Alert position="fixed" bottom={5} right={{ base: 4, md: 6 }} w={{ base: 'calc(100% - 32px)', md: 'auto' }} zIndex={1000} borderRadius="14px" shadow="xl"><AlertIcon /><Box><Text fontWeight="700">{verificationStatus.message}</Text><Text fontSize="sm">{Math.floor(verificationTimer / 60)}:{String(verificationTimer % 60).padStart(2, '0')} remaining</Text></Box></Alert>}
      <Modal isOpen={isVerificationModalOpen} onClose={closeVerificationModal} isCentered><ModalOverlay bg="blackAlpha.400" backdropFilter="blur(8px)" /><ModalContent borderRadius="22px" mx={4}><ModalHeader fontFamily="heading">Check your inbox</ModalHeader><ModalCloseButton /><ModalBody><VStack align="stretch" spacing={4}><Alert status="info" borderRadius="14px"><AlertIcon /><Text>We sent a verification link to <strong>{email}</strong>. Click it to finish creating your FOST account.</Text></Alert><Text textAlign="center" color="gray.500">Link expires in {Math.floor(verificationTimer / 60)}:{String(verificationTimer % 60).padStart(2, '0')}</Text><Button variant="outline" onClick={resendVerificationEmail} isDisabled={verificationTimer > 270}>Resend verification email</Button></VStack></ModalBody><ModalFooter><Text fontSize="sm" color="gray.500" mr="auto">You can close this and verify later.</Text><Button variant="ghost" onClick={closeVerificationModal}>Close</Button></ModalFooter></ModalContent></Modal>
    </Flex>
  );
};

export default Register;
