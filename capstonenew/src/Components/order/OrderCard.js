import React from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  Divider,
  Button,
  Stack,
  HStack
} from '@chakra-ui/react';
import { formatDate, getStatusColor } from '../../pages/utils/helpers';

const OrderCard = ({ order, updateOrderStatus, onCompleteOrder, onScanQR }) => (
  <Box
    borderWidth="1px"
    borderRadius="lg"
    p={6}
    bg="white"
    shadow="sm"
  >
    <Stack spacing={4}>
      <HStack justify="space-between">
        <Badge
          colorScheme={getStatusColor(order.status)}
          fontSize="0.9em"
          p={2}
          borderRadius="md"
        >
          {order.status.toUpperCase().replace('_', ' ')}
        </Badge>
        <Text fontSize="sm" color="gray.600">
          {formatDate(order.createdAt)}
        </Text>
      </HStack>

      <Box>
        <Text fontWeight="bold" mb={2}>Customer Details</Text>
        <Text>Email: {order.customerEmail}</Text>
      </Box>

      <Divider />

      <Box>
        <Text fontWeight="bold" mb={2}>Order Items</Text>
        <VStack align="stretch" spacing={2}>
          {order.items.map((item, index) => (
            <HStack key={index} justify="space-between">
              <Text>{item.name} x{item.quantity}</Text>
              <Text>${(item.price * item.quantity).toFixed(2)}</Text>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Divider />

      <HStack justify="space-between">
        <Text fontWeight="bold">Total Amount:</Text>
        <Text fontWeight="bold" color="green.600">
          ${order.total !== undefined ? order.total.toFixed(2):"N/A"}
        </Text>
      </HStack>

      {order.status === 'completed' && (
        <Box>
          <Text fontWeight="bold" color="blue.600">
            Pickup Code: {order.pickupCode}
          </Text>
        </Box>
      )}

      {/* Show Scan QR Code button only after marking as ready */}
      {order.status === 'completed' && (
        <HStack spacing={4}>
          <Button
            colorScheme="teal"
            onClick={onScanQR}
            flex={1}
          >
            Scan QR Code
          </Button>
        </HStack>
      )}

      {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'picked_up' && (
        <HStack spacing={4}>
          {order.status === 'pending' && (
            <Button
              colorScheme="blue"
              onClick={() => updateOrderStatus(order.id, 'processing')}
              flex={1}
            >
              Start Processing
            </Button>
          )}
          {order.status === 'processing' && (
            <>
              <Button
                colorScheme="green"
                onClick={() => onCompleteOrder(order)}
                flex={1}
              >
                Mark as Ready
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                flex={1}
              >
                Cancel Order
              </Button>
            </>
          )}
        </HStack>
      )}
    </Stack>
  </Box>
);

export default OrderCard;