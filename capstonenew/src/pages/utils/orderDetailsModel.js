// OrderDetailsModal.jsx
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
} from '@chakra-ui/react';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'yellow';
    case 'processing': return 'blue';
    case 'completed': return 'green';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'express': return 'green';
    case 'standard': return 'blue';
    case 'complex': return 'orange';
    default: return 'gray';
  }
};

const calculatePrepTime = (items) => {
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  return 2 + totalItems;
};

const calculateOrderPriority = (order) => {
  const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const waitTime = (new Date() - order.createdAt) / (1000 * 60);
  
  let category;
  if (totalItems <= 2) {
    category = 'express';
  } else if (totalItems <= 5) {
    category = 'standard';
  } else {
    category = 'complex';
  }

  let priorityScore = totalItems;
  if (waitTime > 15) {
    priorityScore -= (waitTime / 15);
  }

  return {
    category,
    totalItems,
    priorityScore,
    estimatedPrepTime: calculatePrepTime(order.items),
    waitTime: Math.round(waitTime)
  };
};

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  const priority = order ? calculateOrderPriority(order) : null;
  
  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            <Text>Order #{order.id.slice(-6)}</Text>
            <Badge colorScheme={getStatusColor(order.status)}>
              {order.status.toUpperCase()}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <StatGroup>
              <Stat>
                <StatLabel>Order Type</StatLabel>
                <StatNumber>
                  <Badge colorScheme={getCategoryColor(priority.category)}>
                    {priority.category.toUpperCase()}
                  </Badge>
                </StatNumber>
                <StatHelpText>{priority.totalItems} items</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Wait Time</StatLabel>
                <StatNumber>{priority.waitTime} min</StatNumber>
                <StatHelpText>Est. prep: {priority.estimatedPrepTime} min</StatHelpText>
              </Stat>
            </StatGroup>

            <Box>
              <Text fontWeight="bold" mb={2}>Order Items:</Text>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th isNumeric>Quantity</Th>
                    <Th isNumeric>Price</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {order.items?.map((item, index) => (
                    <Tr key={index}>
                      <Td>{item.name}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td isNumeric>${item.price?.toFixed(2)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {order.customer && (
              <Box>
                <Text fontWeight="bold" mb={2}>Customer Details:</Text>
                <Text>Name: {order.customer.name}</Text>
                {order.customer.phone && <Text>Phone: {order.customer.phone}</Text>}
                {order.customer.email && <Text>Email: {order.customer.email}</Text>}
              </Box>
            )}

            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text>Order created: {order.createdAt.toLocaleString()}</Text>
                {order.updatedAt && (
                  <Text>Last updated: {order.updatedAt.toLocaleString()}</Text>
                )}
              </VStack>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OrderDetailsModal