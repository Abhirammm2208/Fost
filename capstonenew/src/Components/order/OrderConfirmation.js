import React, { useState, useEffect } from 'react';
import { 
  VStack, 
  Box, 
  Heading, 
  Text, 
  Flex, 
  keyframes, 
  chakra,
  Container,
  Button
} from '@chakra-ui/react';
import { CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderPickupConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirmation, setShowConfirmation] = useState(true);

  // Bounce animation for the checkmark
  const bounceKeyframes = keyframes`
    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
    40% {transform: translateY(-20px);}
    60% {transform: translateY(-10px);}
  `;

  const BouncingCheckIcon = chakra(CheckCircle, {
    baseStyle: {
      animation: `${bounceKeyframes} 1.5s ease infinite`,
      color: 'green.500',
      size: '100px'
    }
  });

  // Automatically return to home after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Container 
      maxW="container.sm" 
      py={8} 
      bg="gray.50" 
      minHeight="100vh" 
      display="flex" 
      alignItems="center"
    >
      {showConfirmation && (
        <VStack spacing={6} textAlign="center" width="full">
          <BouncingCheckIcon />
          
          <Heading size="xl" color="green.600">
            Picked Up Successfully!
          </Heading>
          
          <Box 
            bg="white" 
            p={6} 
            borderRadius="lg" 
            boxShadow="md" 
            maxWidth="400px"
          >
            <Text fontSize="lg" color="gray.600">
              Thank you for choosing Fost! 
              Your order has been successfully picked up.
            </Text>
          </Box>
          
          <Text color="gray.500">
            You'll be redirected to the home page in 5 seconds...
          </Text>
          
          <Button 
            colorScheme="green" 
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </VStack>
      )}
    </Container>
  );
};

export default OrderPickupConfirmation;