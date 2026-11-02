import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Progress, 
  Icon, 
  VStack,
  HStack,
  Button
} from '@chakra-ui/react';
import { 
  Clock, 
  ShoppingBag, 
  CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OngoingOrderCard = ({ order }) => {
  const navigate = useNavigate();

  const getStatusDetails = () => {
    switch(order.status) {
      case 'pending':
        return {
          description: 'Order Accepted',
          progressValue: 30,
          icon: Clock,
          color: 'blue'
        };
      case 'processing':
        return {
          description: 'Being Prepared',
          progressValue: 70,
          icon: ShoppingBag,
          color: 'orange'
        };
      case 'completed':
        return {
          description: 'Ready for Pickup',
          progressValue: 100,
          icon: CheckCircle,
          color: 'green'
        };
      default:
        return {
          description: 'Processing',
          progressValue: 50,
          icon: Clock,
          color: 'gray'
        };
    }
  };

  const statusDetails = getStatusDetails();

  const handleViewOrder = () => {
    navigate('/order-waiting', { state: { orderId: order.id } });
  };

  return (
    <Box 
      bg="white" 
      borderRadius="lg" 
      boxShadow="md" 
      p={4} 
      mb={4}
      transition="all 0.3s"
      _hover={{
        transform: 'scale(1.02)',
        boxShadow: 'lg'
      }}
    >
      <Flex alignItems="center" justifyContent="space-between" mb={3}>
        <HStack spacing={3}>
          <Icon 
            as={statusDetails.icon} 
            color={`${statusDetails.color}.500`} 
            boxSize={6} 
          />
          <Text fontWeight="bold" color="gray.700">
            Order #{order.id.slice(-6)}
          </Text>
        </HStack>
        <Text color="gray.500" fontSize="sm">
          {new Date(order.createdAt).toLocaleString()}
        </Text>
      </Flex>

      <VStack spacing={3} align="stretch">
        <Progress
          value={statusDetails.progressValue}
          colorScheme={statusDetails.color}
          size="sm"
          borderRadius="full"
          hasStripe
          isAnimated
        />
        
        <Flex justifyContent="space-between" alignItems="center">
          <Text color="gray.600">
            {statusDetails.description}
          </Text>
          <Button 
            size="sm" 
            colorScheme="green" 
            onClick={handleViewOrder}
          >
            View Order
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default OngoingOrderCard;