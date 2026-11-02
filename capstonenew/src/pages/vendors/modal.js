import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Button,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip
} from '@chakra-ui/react';
import { 
  AiOutlinePlayCircle, 
  AiOutlineCheckCircle,
  AiOutlineStop,
  AiOutlineClockCircle
} from 'react-icons/ai';
import { enhanceOrderModalData } from './orderPrioritization';

export const OrderDetailsModal = ({ isOpen, onClose, order, onUpdateStatus }) => {
  if (!order) return null;

  const enhancedOrder = enhanceOrderModalData(order);
  const { priorityInfo } = enhancedOrder;

  const getPriorityColor = (score) => {
    if (score > 8) return 'red';
    if (score > 5) return 'yellow';
    return 'green';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Order Details #{order.id.slice(-6)}
          <HStack spacing={2} mt={2}>
            <Badge
              colorScheme={getPriorityColor(priorityInfo.score)}
              display="flex"
              alignItems="center"
            >
              <AiOutlineClockCircle style={{ marginRight: '4px' }} />
              {priorityInfo.estimatedPrepTime} min prep time
            </Badge>
            <Tooltip label={`Priority Score: ${priorityInfo.score}`}>
              <Badge colorScheme={getPriorityColor(priorityInfo.score)}>
                {priorityInfo.recommendation}
              </Badge>
            </Tooltip>
          </HStack>
        </ModalHeader>
        {/* Rest of the existing modal content */}
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {/* Existing customer information section */}
            <Box>
              <Text fontWeight="bold">Customer Information</Text>
              <Text>Name: {order.customer?.name || 'Anonymous'}</Text>
              <Text>Email: {order.customer?.email || 'N/A'}</Text>
              <Text>Phone: {order.customer?.phone || 'N/A'}</Text>
            </Box>

            <Divider />

            {/* Enhanced order summary section */}
            <Box>
              <Text fontWeight="bold" mb={2}>Order Priority Details</Text>
              <VStack align="stretch" spacing={2} p={3} bg="gray.50" borderRadius="md">
                <HStack justify="space-between">
                  <Text>Preparation Time:</Text>
                  <Text fontWeight="bold">{priorityInfo.estimatedPrepTime} minutes</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Order Complexity:</Text>
                  <Text fontWeight="bold">{priorityInfo.complexity.toFixed(1)}</Text>
                </HStack>
                <Text color="gray.600" fontSize="sm">
                  {priorityInfo.recommendation}
                </Text>
              </VStack>
            </Box>

            {/* Rest of the existing modal content */}
            {/* ... */}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            {order.status === 'pending' && (
              <Button
                colorScheme="green"
                onClick={() => onUpdateStatus(order.id, 'processing')}
                leftIcon={<AiOutlinePlayCircle />}
              >
                Start Processing
              </Button>
            )}
            {order.status === 'processing' && (
              <>
                <Button
                  colorScheme="green"
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                  leftIcon={<AiOutlineCheckCircle />}
                >
                  Complete
                </Button>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                  leftIcon={<AiOutlineStop />}
                >
                  Cancel
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};