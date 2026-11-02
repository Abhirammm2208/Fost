import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Stack,
  useToast,
  Switch,
  Textarea,
  VStack,
  Heading,
  Container,
  InputGroup,
  InputRightAddon,
  FormHelperText,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../Components/firebase/Firebase';

const AddCouponForm = () => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  
  const [formData, setFormData] = useState({
    code: '',
    isActive: true,
    validUntil: '',
    validFrom: '',
    minimumOrderAmount: 0,
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: 0,
    description: '',
    usageLimit: 1,
    usageCount: 0,
    userLimit: 1,
    categories: [],
    excludedProducts: [],
    metadata: {
      campaign: '',
      source: ''
    }
  });

  const [category, setCategory] = useState('');
  const [excludedProduct, setExcludedProduct] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({
      ...prev,
      isActive: e.target.checked
    }));
  };

  const addCategory = () => {
    if (category && !formData.categories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
      setCategory('');
    }
  };

  const removeCategory = (categoryToRemove) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  const addExcludedProduct = () => {
    if (excludedProduct && !formData.excludedProducts.includes(excludedProduct)) {
      setFormData(prev => ({
        ...prev,
        excludedProducts: [...prev.excludedProducts, excludedProduct]
      }));
      setExcludedProduct('');
    }
  };

  const removeExcludedProduct = (productToRemove) => {
    setFormData(prev => ({
      ...prev,
      excludedProducts: prev.excludedProducts.filter(prod => prod !== productToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const couponData = {
        ...formData,
        validUntil: Timestamp.fromDate(new Date(formData.validUntil)),
        validFrom: Timestamp.fromDate(new Date(formData.validFrom)),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(firestore, 'coupons'), couponData);

      toast({
        title: 'Coupon created successfully!',
        description: `Coupon ID: ${docRef.id}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        code: '',
        isActive: true,
        validUntil: '',
        validFrom: '',
        minimumOrderAmount: 0,
        discountType: 'percentage',
        discountValue: 0,
        maxDiscount: 0,
        description: '',
        usageLimit: 1,
        usageCount: 0,
        userLimit: 1,
        categories: [],
        excludedProducts: [],
        metadata: {
          campaign: '',
          source: ''
        }
      });
    } catch (error) {
      toast({
        title: 'Error creating coupon',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Box bg={bgColor} rounded="lg" p={6} boxShadow="lg">
        <VStack spacing={6} as="form" onSubmit={handleSubmit}>
          <Heading size="lg">Create New Coupon</Heading>

          <FormControl isRequired>
            <FormLabel>Coupon Code</FormLabel>
            <Input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g., SUMMER2024"
            />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Active</FormLabel>
            <Switch
              isChecked={formData.isActive}
              onChange={handleSwitchChange}
            />
          </FormControl>

          <Stack direction={{ base: 'column', md: 'row' }} w="full" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Valid From</FormLabel>
              <Input
                type="datetime-local"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Valid Until</FormLabel>
              <Input
                type="datetime-local"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
              />
            </FormControl>
          </Stack>

          <Stack direction={{ base: 'column', md: 'row' }} w="full" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Discount Type</FormLabel>
              <Select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Discount Value</FormLabel>
              <InputGroup>
                <NumberInput
                  min={0}
                  value={formData.discountValue}
                  onChange={(value) => handleNumberChange('discountValue', value)}
                  w="full"
                >
                  <NumberInputField />
                </NumberInput>
                <InputRightAddon>
                  {formData.discountType === 'percentage' ? '%' : '₹'}
                </InputRightAddon>
              </InputGroup>
            </FormControl>
          </Stack>

          <Stack direction={{ base: 'column', md: 'row' }} w="full" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Minimum Order Amount</FormLabel>
              <InputGroup>
                <NumberInput
                  min={0}
                  value={formData.minimumOrderAmount}
                  onChange={(value) => handleNumberChange('minimumOrderAmount', value)}
                  w="full"
                >
                  <NumberInputField />
                </NumberInput>
                <InputRightAddon>₹</InputRightAddon>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Maximum Discount</FormLabel>
              <InputGroup>
                <NumberInput
                  min={0}
                  value={formData.maxDiscount}
                  onChange={(value) => handleNumberChange('maxDiscount', value)}
                  w="full"
                >
                  <NumberInputField />
                </NumberInput>
                <InputRightAddon>₹</InputRightAddon>
              </InputGroup>
            </FormControl>
          </Stack>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter coupon description"
            />
          </FormControl>

          <Stack direction={{ base: 'column', md: 'row' }} w="full" spacing={4}>
            <FormControl>
              <FormLabel>Usage Limit</FormLabel>
              <NumberInput
                min={1}
                value={formData.usageLimit}
                onChange={(value) => handleNumberChange('usageLimit', value)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>User Limit</FormLabel>
              <NumberInput
                min={1}
                value={formData.userLimit}
                onChange={(value) => handleNumberChange('userLimit', value)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </Stack>

          <FormControl>
            <FormLabel>Categories</FormLabel>
            <InputGroup>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category name"
              />
              <InputRightAddon>
                <Button size="sm" onClick={addCategory}>Add</Button>
              </InputRightAddon>
            </InputGroup>
            <Box mt={2}>
              {formData.categories.map((cat) => (
                <Tag key={cat} m={1} size="md" borderRadius="full" variant="solid">
                  <TagLabel>{cat}</TagLabel>
                  <TagCloseButton onClick={() => removeCategory(cat)} />
                </Tag>
              ))}
            </Box>
          </FormControl>

          <FormControl>
            <FormLabel>Excluded Products</FormLabel>
            <InputGroup>
              <Input
                value={excludedProduct}
                onChange={(e) => setExcludedProduct(e.target.value)}
                placeholder="Enter product ID"
              />
              <InputRightAddon>
                <Button size="sm" onClick={addExcludedProduct}>Add</Button>
              </InputRightAddon>
            </InputGroup>
            <Box mt={2}>
              {formData.excludedProducts.map((prod) => (
                <Tag key={prod} m={1} size="md" borderRadius="full" variant="solid">
                  <TagLabel>{prod}</TagLabel>
                  <TagCloseButton onClick={() => removeExcludedProduct(prod)} />
                </Tag>
              ))}
            </Box>
          </FormControl>

          <Stack direction={{ base: 'column', md: 'row' }} w="full" spacing={4}>
            <FormControl>
              <FormLabel>Campaign Name</FormLabel>
              <Input
                name="metadata.campaign"
                value={formData.metadata.campaign}
                onChange={handleChange}
                placeholder="e.g., Summer Sale 2024"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Campaign Source</FormLabel>
              <Input
                name="metadata.source"
                value={formData.metadata.source}
                onChange={handleChange}
                placeholder="e.g., Email Campaign"
              />
            </FormControl>
          </Stack>

          <Button
            colorScheme="blue"
            type="submit"
            isLoading={isSubmitting}
            width="full"
          >
            Create Coupon
          </Button>
        </VStack>
      </Box>
    </Container>
  );
};

export default AddCouponForm;