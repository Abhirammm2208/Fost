import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useBreakpointValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { app } from '../firebase/Firebase';
import { ArrowRight, Menu as MenuIcon, ShoppingBag, UserRound, X } from 'lucide-react';
import logo from '../../Assets/Fos_t-removebg-preview.png';

const navLinks = [
  { label: 'Discover', path: '/main' },
  { label: 'How it works', path: '/HowItWorks' },
  { label: 'Our story', path: '/AboutUs' },
];

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [shopStatus, setShopStatus] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    const loadCartCount = () => {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(items.reduce((total, item) => total + (item.quantity || 1), 0));
    };

    handleScroll();
    loadCartCount();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('cartUpdate', loadCartCount);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cartUpdate', loadCartCount);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setUser(null);
        localStorage.removeItem('user');
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', authUser.uid));
        const userData = userDoc.data() || {};
        const fullUser = {
          uid: authUser.uid,
          email: authUser.email,
          role: userData.role || 'customer',
          shopId: userData.shopId || null,
        };

        if (fullUser.role === 'vendor' && fullUser.shopId) {
          const shopDoc = await getDoc(doc(firestore, 'shops', fullUser.shopId));
          if (shopDoc.exists()) setShopStatus(shopDoc.data().isOpen ?? true);
        }

        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const handleShopStatusToggle = async () => {
    if (!user?.shopId) return;
    try {
      const newStatus = !shopStatus;
      await updateDoc(doc(firestore, 'shops', user.shopId), { isOpen: newStatus });
      setShopStatus(newStatus);
      toast({ title: `Shop ${newStatus ? 'opened' : 'closed'}`, status: 'success', duration: 2400, isClosable: true });
    } catch (error) {
      toast({ title: 'Could not update shop status', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    setUser(null);
    go('/login');
  };

  const CartButton = ({ mobile = false }) => (
    <Button
      aria-label="Open cart"
      onClick={() => go('/cart')}
      variant="ghost"
      px={mobile ? 3 : 4}
      h="44px"
      borderRadius="12px"
      color="ink"
      _hover={{ bg: 'brand.50', color: 'brand.600' }}
      leftIcon={<ShoppingBag size={18} strokeWidth={2.2} />}
      position="relative"
    >
      {!mobile && 'Cart'}
      {cartCount > 0 && (
        <Badge position="absolute" top="2px" right="1px" bg="brand.500" color="white" borderRadius="full" fontSize="10px" minW="18px" h="18px" display="grid" placeItems="center">
          {cartCount}
        </Badge>
      )}
    </Button>
  );

  const AuthActions = ({ mobile = false }) => (
    <Flex direction={mobile ? 'column' : 'row'} gap={2} w={mobile ? 'full' : 'auto'}>
      <Button variant="ghost" onClick={() => go('/login')} w={mobile ? 'full' : 'auto'}>
        Sign in
      </Button>
      <Button colorScheme="brand" onClick={() => go('/register')} rightIcon={<ArrowRight size={17} />} w={mobile ? 'full' : 'auto'}>
        Join FOST
      </Button>
    </Flex>
  );

  const UserMenu = () => (
    <Menu placement="bottom-end">
      <MenuButton as={Button} variant="ghost" p={1} pr={3} borderRadius="full" _hover={{ bg: 'blackAlpha.50' }}>
        <HStack spacing={2}>
          <Avatar size="sm" name={user?.email} bg="moss.100" color="moss.700" icon={<UserRound size={17} />} />
          <Text display={{ base: 'none', xl: 'block' }} fontWeight="700" fontSize="sm" maxW="120px" noOfLines={1}>{user?.email?.split('@')[0]}</Text>
        </HStack>
      </MenuButton>
      <MenuList borderRadius="16px" p={2} shadow="xl">
        <MenuItem borderRadius="10px" onClick={() => go('/Profile')}>Profile</MenuItem>
        {user?.role === 'admin' && <MenuItem borderRadius="10px" onClick={() => go('/admin/shops')}>Admin dashboard</MenuItem>}
        {user?.role === 'admin' && <MenuItem borderRadius="10px" onClick={() => go('/admin/Groceriesbyfostdash')}>Item management</MenuItem>}
        {user?.role === 'vendor' && <MenuItem borderRadius="10px" onClick={() => go('/vendor/PendingVendors')}>Vendor dashboard</MenuItem>}
        {user?.role === 'vendor' && <MenuItem borderRadius="10px" onClick={() => go('/vendor/items')}>Manage items</MenuItem>}
        {user?.role === 'vendor' && <MenuItem borderRadius="10px" onClick={handleShopStatusToggle}>{shopStatus ? 'Close shop' : 'Open shop'}</MenuItem>}
        <MenuItem borderRadius="10px" color="red.500" onClick={handleLogout}>Sign out</MenuItem>
      </MenuList>
    </Menu>
  );

  return (
    <Box position="sticky" top={0} zIndex={1000} px={{ base: 3, md: 6 }} pt={{ base: 3, md: 4 }}>
      <Flex
        as="nav"
        maxW="1240px"
        mx="auto"
        minH="68px"
        px={{ base: 3, md: 5 }}
        align="center"
        justify="space-between"
        bg="rgba(255,255,255,.88)"
        backdropFilter="blur(18px)"
        border="1px solid"
        borderColor={scrolled ? 'blackAlpha.100' : 'transparent'}
        borderRadius="18px"
        boxShadow={scrolled ? '0 14px 35px rgba(24,35,29,.08)' : 'none'}
        transition="all .25s ease"
      >
        <Link to="/" aria-label="FOST home">
          <HStack spacing={2}>
            <Image src={logo} alt="FOST" h={{ base: '38px', md: '46px' }} w="auto" objectFit="contain" />
            <Box display={{ base: 'none', sm: 'block' }} borderLeft="1px solid" borderColor="blackAlpha.200" pl={3}>
              <Text fontSize="10px" lineHeight="1.1" letterSpacing=".15em" fontWeight="800">FOOD, ON</Text>
              <Text fontSize="10px" lineHeight="1.1" letterSpacing=".15em" fontWeight="800" color="brand.500">YOUR TERMS</Text>
            </Box>
          </HStack>
        </Link>

        {!isMobile ? (
          <HStack spacing={1} ml="auto" mr={4}>
            {navLinks.map((item) => (
              <Button key={item.path} as={Link} to={item.path} variant="ghost" size="sm" color={location.pathname === item.path ? 'brand.600' : 'gray.600'} _hover={{ color: 'brand.600', bg: 'brand.50' }}>
                {item.label}
              </Button>
            ))}
          </HStack>
        ) : null}

        <HStack spacing={1}>
          <CartButton mobile={isMobile} />
          {!isMobile && (user ? <UserMenu /> : <AuthActions />)}
          {isMobile && <IconButton aria-label="Open navigation" icon={isOpen ? <X size={20} /> : <MenuIcon size={20} />} onClick={isOpen ? onClose : onOpen} variant="ghost" borderRadius="12px" />}
        </HStack>
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <DrawerContent borderTopLeftRadius="24px" borderBottomLeftRadius="24px">
          <DrawerCloseButton top={5} right={5} />
          <DrawerHeader pt={8} fontFamily="heading">Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={2}>
              {navLinks.map((item) => <Button key={item.path} variant="ghost" justifyContent="flex-start" onClick={() => go(item.path)}>{item.label}</Button>)}
              {user ? (
                <>
                  <Button variant="ghost" justifyContent="flex-start" onClick={() => go('/Profile')}>Profile</Button>
                  {user.role === 'vendor' && <Button variant="ghost" justifyContent="flex-start" onClick={() => go('/vendor/items')}>Manage items</Button>}
                  <Button variant="ghost" justifyContent="flex-start" color="red.500" onClick={handleLogout}>Sign out</Button>
                </>
              ) : <AuthActions mobile />}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
