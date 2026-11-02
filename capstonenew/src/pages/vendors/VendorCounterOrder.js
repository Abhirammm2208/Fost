import React, { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Box,
  Text,
  Flex,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import { 
  AiOutlineSearch, 
  AiOutlinePlus, 
  AiOutlineMinus, 
  AiOutlineShoppingCart 
} from 'react-icons/ai';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const VendorCounterOrder = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const toast = useToast();
  const firestore = getFirestore();

  // Fetch menu items from Firestore
  const fetchMenuItems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log("User Shop ID:", user.shopId); // Debug log
  
      const menuRef = collection(firestore, 'items');
      const q = query(menuRef, where('shopId', '==', user.shopId));
      const snapshot = await getDocs(q);
      
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("Fetched Menu Items:", itemsList); // Debug log
      setMenuItems(itemsList);
    } catch (error) {
      console.error('Failed to fetch menu items', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch menu items',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add item to cart
  const addToCart = (item) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === itemId);
    
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingItemIndex].quantity > 1) {
        updatedCart[existingItemIndex].quantity -= 1;
      } else {
        updatedCart.splice(existingItemIndex, 1);
      }
      setCart(updatedCart);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  // Place order
  const placeOrder = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Validate inputs
      if (cart.length === 0) {
        toast({
          title: 'Cart is Empty',
          description: 'Please add items to the cart',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      // Ensure shopName is a string and has a default value
      const orderData = {
        shopId: user.shopId || '',
        shopName: user.shopName || 'Unknown Shop', // Add a default value
        customer: customerDetails,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalPrice: parseFloat(calculateTotal()),
        paymentMethod,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      // Add order to Firestore
      const orderRef = await addDoc(collection(firestore, 'orders'), orderData);
  
      // Reset states
      setCart([]);
      setCustomerDetails({ name: '', phone: '' });
      setPaymentMethod('cash');
  
      toast({
        title: 'Order Placed',
        description: `Order #${orderRef.id.slice(-6)} created successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to place order:', error);
      toast({
        title: 'Error',
        description: `Failed to place order: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex gap={6}>
        {/* Menu Items Section */}
        <VStack spacing={6} flex="2">
          <Heading size="xl">Counter Order</Heading>
          
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <AiOutlineSearch />
            </InputLeftElement>
            <Input 
              placeholder="Search menu items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Flex wrap="wrap" gap={4} justifyContent="center">
            {filteredMenuItems.map(item => (
              <Box 
                key={item.id} 
                borderWidth={1} 
                borderRadius="lg" 
                p={4} 
                width="200px"
                textAlign="center"
              >
                <VStack>
                  <Text fontWeight="bold">{item.name}</Text>
                  <Text color="green.500">${item.price.toFixed(2)}</Text>
                  <Button 
                    colorScheme="blue" 
                    size="sm" 
                    onClick={() => addToCart(item)}
                  >
                    Add to Order
                  </Button>
                </VStack>
              </Box>
            ))}
          </Flex>
        </VStack>

        {/* Cart Section */}
        <VStack spacing={6} flex="1" borderLeftWidth={1} pl={4}>
          <Heading size="lg">Current Order</Heading>
          
          {cart.length === 0 ? (
            <Text color="gray.500">No items in cart</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Item</Th>
                  <Th>Qty</Th>
                  <Th>Price</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {cart.map(item => (
                  <Tr key={item.id}>
                    <Td>{item.name}</Td>
                    <Td>{item.quantity}</Td>
                    <Td>${(item.price * item.quantity).toFixed(2)}</Td>
                    <Td>
                      <HStack>
                        <Button 
                          size="xs" 
                          onClick={() => removeFromCart(item.id)}
                        >
                          <AiOutlineMinus />
                        </Button>
                        <Button 
                          size="xs" 
                          onClick={() => addToCart(item)}
                        >
                          <AiOutlinePlus />
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}

          <VStack width="100%" spacing={4}>
            <Text fontWeight="bold" fontSize="xl">
              Total: ${calculateTotal()}
            </Text>

            <Button 
              colorScheme="green" 
              size="lg" 
              width="100%"
              onClick={() => setIsCustomerModalOpen(true)}
              leftIcon={<AiOutlineShoppingCart />}
              isDisabled={cart.length === 0}
            >
              Complete Order
            </Button>
          </VStack>
        </VStack>
      </Flex>

      {/* Customer Details Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Customer Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Customer Name (Optional)</FormLabel>
                <Input 
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails(prev => ({
                    ...prev, 
                    name: e.target.value
                  }))}
                  placeholder="Enter customer name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Customer Phone (Optional)</FormLabel>
                <Input 
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails(prev => ({
                    ...prev, 
                    phone: e.target.value
                  }))}
                  placeholder="Enter phone number"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Payment Method</FormLabel>
                <Select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={() => {
                placeOrder();
                setIsCustomerModalOpen(false);
              }}
            >
              Confirm Order
            </Button>
            <Button variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default VendorCounterOrder;