import React, { useState, useEffect } from 'react';
import {
  VStack,
  Input,
  Button,
  Text,
  Alert,
  HStack,
  useToast,
  Box,
  Icon,
  InputGroup,
  InputRightElement,
  Badge,
  useColorModeValue,
  Fade
} from '@chakra-ui/react';
import { Tag, Check, X } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const CouponComponent = ({ total, onCouponApply }) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const firestore = getFirestore();

  const cardBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const successBg = useColorModeValue('green.50', 'green.900');
  const successText = useColorModeValue('green.700', 'green.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const triggerConfetti = () => {
    // Fire confetti from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0, y: 0.6 }
    });

    // Fire confetti from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 1, y: 0.6 }
    });
  };

  const validateCoupon = async () => {
    if (!couponCode) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const couponsRef = collection(firestore, 'coupons');
      const currentDate = Timestamp.now();
      
      const q = query(
        couponsRef,
        where('code', '==', couponCode.trim().toUpperCase()),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({
          title: 'Invalid Coupon',
          description: 'This coupon code does not exist or has expired',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      const couponDoc = querySnapshot.docs[0];
      const couponData = couponDoc.data();

      // Additional validation checks
      if (currentDate < couponData.validFrom) {
        toast({
          title: 'Coupon Not Yet Active',
          description: 'This coupon is not valid yet',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      if (currentDate > couponData.validUntil) {
        toast({
          title: 'Coupon Expired',
          description: 'This coupon has expired',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      if (couponData.usageCount >= couponData.usageLimit) {
        toast({
          title: 'Coupon Limit Reached',
          description: 'This coupon has reached its usage limit',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      if (total < couponData.minimumOrderAmount) {
        toast({
          title: 'Minimum Order Amount Not Met',
          description: `Minimum order amount required is ₹${couponData.minimumOrderAmount}`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (couponData.discountType === 'percentage') {
        discountAmount = (total * couponData.discountValue) / 100;
        if (couponData.maxDiscount) {
          discountAmount = Math.min(discountAmount, couponData.maxDiscount);
        }
      } else {
        discountAmount = Math.min(couponData.discountValue, total);
      }

      setAppliedCoupon({
        ...couponData,
        discountAmount,
        id: couponDoc.id
      });

      onCouponApply(discountAmount);

      // Trigger confetti animation
      triggerConfetti();

      toast({
        title: 'Coupon Applied Successfully!',
        description: `You saved ₹${discountAmount.toFixed(2)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Coupon validation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate coupon. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    onCouponApply(0);
    toast({
      title: 'Coupon Removed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box p={4} bg={cardBg} borderWidth="1px" borderRadius="lg" borderColor={borderColor} shadow="sm">
      <VStack spacing={4} align="stretch">
        {!appliedCoupon ? (
          <Fade in={true}>
            <VStack spacing={3} align="stretch">
              <HStack spacing={2}>
                <Icon as={Tag} className="h-4 w-4" color="gray.500" />
                <Text fontSize="sm" color="gray.600">
                  Have a coupon code?
                </Text>
              </HStack>
              <InputGroup size="md">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  bg={inputBg}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    colorScheme="blue"
                    isLoading={isLoading}
                    onClick={validateCoupon}
                    disabled={!couponCode}
                  >
                    Apply
                  </Button>
                </InputRightElement>
              </InputGroup>
            </VStack>
          </Fade>
        ) : (
          <Fade in={true}>
            <Alert status="success" bg={successBg} borderRadius="md">
              <HStack justify="space-between" w="100%">
                <HStack spacing={3}>
                  <Icon as={Check} className="h-4 w-4" color={successText} />
                  <VStack align="start" spacing={0}>
                    <HStack>
                      <Text fontWeight="medium" color={successText}>
                        {appliedCoupon.code}
                      </Text>
                      <Badge colorScheme="green" variant="subtle">
                        Applied
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color={successText}>
                      You saved ₹{appliedCoupon.discountAmount.toFixed(2)}!
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="green"
                  onClick={removeCoupon}
                  leftIcon={<Icon as={X} className="h-4 w-4" />}
                >
                  Remove
                </Button>
              </HStack>
            </Alert>
          </Fade>
        )}
      </VStack>
    </Box>
  );
};

export default CouponComponent;