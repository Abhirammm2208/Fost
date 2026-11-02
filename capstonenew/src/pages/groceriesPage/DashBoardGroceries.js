import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Image,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  Switch,
  Badge,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getFirestore
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Import your Firebase config
import { app } from '../../Components/firebase/Firebase';

const CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Bakery",
  "Pantry",
  "Beverages",
  "Snacks",
  "Household",
];

const GroceryDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    weight: '',
    isActive: true,
    imageUrl: '',
    discount: '0'
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Color modes
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'itemsGroceries'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!productImage) return null;
    
    const storageRef = ref(storage, `groceries/${Date.now()}_${productImage.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, productImage);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let imageUrl = formData.imageUrl;
      if (productImage) {
        imageUrl = await uploadImage();
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount),
        imageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'itemsGroceries', editingProduct.id), productData);
        toast({
          title: 'Success',
          description: 'Product updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addDoc(collection(db, 'itemsGroceries'), productData);
        toast({
          title: 'Success',
          description: 'Product added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      await fetchProducts();
      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save product',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateDoc(doc(db, 'itemsGroceries', product.id), {
        isActive: !product.isActive,
        updatedAt: new Date()
      });
      await fetchProducts();
      toast({
        title: 'Success',
        description: `Product ${product.isActive ? 'deactivated' : 'activated'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '',
      weight: '',
      isActive: true,
      imageUrl: '',
      discount: '0'
    });
    setProductImage(null);
    setImagePreview('');
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      weight: product.weight,
      isActive: product.isActive,
      imageUrl: product.imageUrl,
      discount: product.discount?.toString() || '0'
    });
    setImagePreview(product.imageUrl);
    onOpen();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={6}>
      <Container maxW="container.xl">
        <VStack spacing={6}>
          <HStack w="full" justify="space-between" wrap="wrap" spacing={4}>
            <Text fontSize="2xl" fontWeight="bold">
              Grocery Product Management
            </Text>
            <HStack spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <SearchIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={() => {
                  resetForm();
                  onOpen();
                }}
              >
                Add Product
              </Button>
            </HStack>
          </HStack>

          <Grid
            templateColumns={{
              base: "repeat(1, 1fr)",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)"
            }}
            gap={6}
            w="full"
          >
            {filteredProducts.map((product) => (
              <Box
                key={product.id}
                bg={cardBg}
                borderRadius="lg"
                overflow="hidden"
                borderWidth="1px"
                borderColor={borderColor}
                opacity={product.isActive ? 1 : 0.6}
              >
                <Image
                  src={product.imageUrl || "https://via.placeholder.com/300"}
                  alt={product.name}
                  h="200px"
                  w="full"
                  objectFit="cover"
                />
                <Box p={4}>
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="lg">{product.name}</Text>
                      <Text color="gray.600" fontSize="sm">{product.weight}</Text>
                    </VStack>
                    <Badge colorScheme="purple">{product.category}</Badge>
                  </HStack>
                  <Text fontSize="xl" fontWeight="bold" mb={2}>
                    ₹{product.price.toFixed(2)}
                  </Text>
                  {product.discount > 0 && (
                    <Badge colorScheme="green" mb={2}>
                      {product.discount}% OFF
                    </Badge>
                  )}
                  <Text noOfLines={2} color="gray.600" mb={4}>
                    {product.description}
                  </Text>
                  <HStack justify="space-between">
                    <Switch
                      isChecked={product.isActive}
                      onChange={() => handleToggleActive(product)}
                      colorScheme="green"
                    />
                    <Button
                      size="sm"
                      leftIcon={<EditIcon />}
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </Button>
                  </HStack>
                </Box>
              </Box>
            ))}
          </Grid>
        </VStack>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Product Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter product name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Select category"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <HStack w="full" spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Price</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="Enter price"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Weight/Size</FormLabel>
                      <Input
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        placeholder="e.g., 1kg, 500g"
                      />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel>Discount (%)</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      placeholder="Enter discount percentage"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter product description"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Product Image</FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      p={1}
                    />
                    {imagePreview && (
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        mt={2}
                        maxH="200px"
                        objectFit="cover"
                      />
                    )}
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Active</FormLabel>
                    <Switch
                      isChecked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      colorScheme="green"
                    />
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    width="full"
                    type="submit"
                    isLoading={submitting}
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </VStack>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default GroceryDashboard;