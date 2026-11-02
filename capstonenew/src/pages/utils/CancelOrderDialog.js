import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Text,
  Divider,
  Box,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  FormErrorMessage,
} from '@chakra-ui/react';
import { getFirestore, updateDoc, doc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { ChevronRightIcon } from '@chakra-ui/icons';

// Import SwipeButton component from previous implementation
import SwipeButton from './SwipeButton';

const CancelOrderDialog = ({ isOpen, onClose, orderId, onOrderCancelled, orderData }) => {
  const [formData, setFormData] = useState({
    handlerName: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.handlerName.trim()) {
      newErrors.handlerName = 'Handler name is required';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Cancellation reason is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const firestore = getFirestore();
      
      // Calculate financial details
      const orderAmount = orderData?.total || 0;
      const itemCount = orderData?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
      
      // Create cancellation record
      const cancellationData = {
        orderId,
        orderDetails: {
          ...orderData,
          orderNumber: orderId.slice(-6)
        },
        handlerName: formData.handlerName.trim(),
        reason: formData.reason.trim(),
        cancelledAt: serverTimestamp(),
        userId: localStorage.getItem('userId') || 'unknown',
        shopId: localStorage.getItem('shopId') || 'unknown',
        customerDetails: orderData?.customer || {},
        financialDetails: {
          orderTotal: orderAmount,
          itemCount,
          paymentMethod: orderData?.paymentMethod || 'unknown',
          currency: orderData?.currency || 'INR'
        },
        orderItems: orderData?.items || [],
        orderCreatedAt: orderData?.createdAt || null
      };

      // Add cancellation record
      const cancelledRef = collection(firestore, 'cancelled');
      const cancelledDoc = await addDoc(cancelledRef, cancellationData);

      // Create financial record
      const financeData = {
        orderId,
        cancellationId: cancelledDoc.id,
        type: 'cancellation',
        amount: orderAmount,
        itemCount,
        timestamp: serverTimestamp(),
        handlerName: formData.handlerName.trim(),
        reason: formData.reason.trim(),
        shopId: localStorage.getItem('shopId') || 'unknown',
        customerDetails: {
          name: orderData?.customer?.name || 'Unknown',
          phone: orderData?.customer?.phone || 'Unknown'
        },
        paymentMethod: orderData?.paymentMethod || 'unknown',
        currency: orderData?.currency || 'INR'
      };

      // Add financial record
      const financesRef = collection(firestore, 'orderFinances');
      await addDoc(financesRef, financeData);

      // Update original order
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
        cancellationId: cancelledDoc.id,
        cancellationSummary: {
          handlerName: formData.handlerName.trim(),
          reason: formData.reason.trim(),
          cancelledAt: serverTimestamp(),
          amount: orderAmount
        }
      });

      toast({
        title: 'Order Cancelled Successfully',
        description: `Order #${orderId.slice(-6)} has been cancelled`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });

      if (typeof onOrderCancelled === 'function') {
        onOrderCancelled(orderId);
      }

      handleClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel order. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ handlerName: '', reason: '' });
    setErrors({});
    onClose();
  };

  const getItemCount = () => {
    return orderData?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      closeOnOverlayClick={false}
      size="md"
    >
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader>
          Cancel Order #{orderId?.slice(-6)}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6}>
            {/* Order Summary */}
            <Box w="100%" p={4} borderRadius="md" bg="gray.50">
              <Stat>
                <StatLabel>Order Amount</StatLabel>
                <StatNumber>{formatCurrency(orderData?.total || 0)}</StatNumber>
              </Stat>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Items: {getItemCount()}
              </Text>
            </Box>
            
            <Divider />

            {/* Form Fields */}
            <FormControl isRequired isInvalid={!!errors.handlerName}>
              <FormLabel>Handler Name</FormLabel>
              <Input
                name="handlerName"
                placeholder="Enter your name"
                value={formData.handlerName}
                onChange={handleInputChange}
                size="md"
                focusBorderColor="red.400"
                isDisabled={isSubmitting}
              />
              <FormErrorMessage>{errors.handlerName}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.reason}>
              <FormLabel>Cancellation Reason</FormLabel>
              <Textarea
                name="reason"
                placeholder="Enter reason for cancellation"
                value={formData.reason}
                onChange={handleInputChange}
                rows={4}
                size="md"
                focusBorderColor="red.400"
                resize="vertical"
                isDisabled={isSubmitting}
              />
              <FormErrorMessage>{errors.reason}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter flexDirection="column" gap={4}>
          <Text fontSize="sm" color="gray.500" w="100%" textAlign="center">
            This action cannot be undone
          </Text>
          <Box w="100%">
            <SwipeButton
              onConfirm={handleSubmit}
              isDisabled={!formData.handlerName || !formData.reason || isSubmitting}
              text="Slide to confirm cancellation"
              size="lg"
              colorScheme="red"
              confirmThreshold={0.8}
            />
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CancelOrderDialog;