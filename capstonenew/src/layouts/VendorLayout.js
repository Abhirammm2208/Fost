import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Box, Button, Divider, Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerOverlay, Flex, HStack, Heading, Icon, IconButton, Text, Tooltip, VStack, useDisclosure } from '@chakra-ui/react';
import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Clock3, History, LineChart, LogOut, Menu, Package, ShoppingBag, Sparkles, X } from 'lucide-react';

const navItems = [
  { label: 'Orders', path: '/vendor/PendingVendors', icon: ShoppingBag },
  { label: 'Processing', path: '/vendor/ProcessingVendors', icon: Clock3 },
  { label: 'Completed', path: '/vendor/CompletedVendor', icon: CheckCircle2 },
  { label: 'Item management', path: '/vendor/items', icon: Package },
  { label: 'Analytics', path: '/vendor/AnalyticVendor', icon: BarChart3 },
  { label: 'Advanced analytics', path: '/vendor/AdvancedAnalytics', icon: LineChart, premium: true },
  { label: 'Order history', path: '/vendor/HistoryVendor', icon: History },
];

const VendorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const resize = () => { if (window.innerWidth >= 900) onClose(); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [onClose]);

  const SidebarContent = ({ mobile = false }) => <VStack align="stretch" spacing={1} h="full"><Flex px={5} py={5} justify="space-between" align="center"><HStack spacing={3}><Box bg="brand.500" color="white" w="36px" h="36px" borderRadius="11px" display="grid" placeItems="center"><Sparkles size={18} /></Box>{(!isCollapsed || mobile) && <Box><Text color="white" fontFamily="heading" fontWeight="700" fontSize="lg" lineHeight="1">FOST</Text><Text color="whiteAlpha.600" fontSize="10px" mt={1} letterSpacing=".1em">PARTNER HUB</Text></Box>}</HStack>{!mobile && <IconButton aria-label="Toggle sidebar" icon={isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />} onClick={() => setIsCollapsed(!isCollapsed)} variant="ghost" color="whiteAlpha.700" _hover={{ color: 'white', bg: 'whiteAlpha.100' }} />}</Flex><Box px={3} pt={4} pb={3}><Text px={3} color="whiteAlpha.500" fontSize="10px" fontWeight="700" letterSpacing=".14em">WORKSPACE</Text></Box><VStack align="stretch" spacing={1} px={3}>{navItems.map((item) => { const active = location.pathname === item.path; return <Tooltip key={item.path} label={isCollapsed && !mobile ? item.label : ''} placement="right" isDisabled={!isCollapsed || mobile}><NavLink to={item.path} style={{ textDecoration: 'none' }} onClick={mobile ? onClose : undefined}><Flex align="center" gap={3} px={3} py={3} borderRadius="12px" bg={active ? 'whiteAlpha.180' : 'transparent'} color={active ? 'white' : 'whiteAlpha.700'} borderLeft={active ? '3px solid' : '3px solid transparent'} borderColor="brand.400" _hover={{ bg: 'whiteAlpha.100', color: 'white' }} transition="all .2s"><Icon as={item.icon} boxSize={18} flexShrink={0} />{(!isCollapsed || mobile) && <><Text fontSize="sm" fontWeight={active ? '700' : '500'} flex="1">{item.label}</Text>{item.premium && <Badge bg="sun" color="ink" borderRadius="full" fontSize="9px" px={2}>PRO</Badge>}</>}</Flex></NavLink></Tooltip>; })}</VStack><Box mt="auto" p={4}><Divider borderColor="whiteAlpha.200" mb={4} />{(!isCollapsed || mobile) && <Box px={3} py={3} bg="whiteAlpha.100" borderRadius="14px" mb={3}><Text color="whiteAlpha.500" fontSize="10px" letterSpacing=".1em">YOUR SHOP</Text><Text color="white" fontWeight="700" fontSize="sm" mt={1}>Vendor workspace</Text><HStack mt={2} spacing={2}><Box w="7px" h="7px" bg="moss.300" borderRadius="full" /><Text color="moss.200" fontSize="xs">Shop is open</Text></HStack></Box>}<Button w="full" justifyContent={isCollapsed && !mobile ? 'center' : 'flex-start'} leftIcon={<LogOut size={17} />} variant="ghost" color="whiteAlpha.650" _hover={{ color: 'white', bg: 'whiteAlpha.100' }} onClick={() => navigate('/login')}>{(!isCollapsed || mobile) && 'Sign out'}</Button></Box></VStack>;

  return <Flex minH="100vh" bg="canvas"><Box display={{ base: 'none', lg: 'block' }} w={isCollapsed ? '78px' : '270px'} bg="ink" position="fixed" insetY={0} left={0} zIndex={10} transition="width .2s"><SidebarContent /></Box><IconButton display={{ base: 'flex', lg: 'none' }} aria-label="Open vendor navigation" icon={<Menu size={20} />} position="fixed" top={4} left={4} zIndex={20} onClick={onOpen} bg="ink" color="white" borderRadius="12px" _hover={{ bg: 'gray.800' }} /><Drawer isOpen={isOpen} placement="left" onClose={onClose}><DrawerOverlay bg="blackAlpha.500" /><DrawerContent bg="ink" color="white"><DrawerHeader display="flex" justifyContent="flex-end"><IconButton aria-label="Close navigation" icon={<X size={18} />} onClick={onClose} variant="ghost" color="white" /></DrawerHeader><DrawerBody p={0}><SidebarContent mobile /></DrawerBody></DrawerContent></Drawer><Box ml={{ base: 0, lg: isCollapsed ? '78px' : '270px' }} w="full" minH="100vh" transition="margin .2s"><Flex h="74px" px={{ base: 5, md: 8 }} pl={{ base: 16, lg: 8 }} align="center" justify="space-between" bg="white" borderBottom="1px solid" borderColor="gray.100" position="sticky" top={0} zIndex={5}><Box><Text color="gray.500" fontSize="xs">PARTNER HUB</Text><Heading fontSize={{ base: 'lg', md: 'xl' }} mt={1}>{navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}</Heading></Box><HStack spacing={3}><HStack display={{ base: 'none', sm: 'flex' }} bg="moss.50" color="moss.700" px={3} py={2} borderRadius="full" spacing={2}><Box w="7px" h="7px" bg="moss.500" borderRadius="full" /><Text fontSize="xs" fontWeight="700">Store online</Text></HStack><Avatar size="sm" name="Vendor" bg="brand.100" color="brand.700" /></HStack></Flex><Box p={{ base: 4, md: 8 }} bg="canvas" minH="calc(100vh - 74px)"><Outlet /></Box></Box></Flex>;
};

export default VendorLayout;
