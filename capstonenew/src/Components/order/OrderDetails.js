import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { 
  CheckIcon, 
  CloseIcon, 
  TimeIcon, 
  EmailIcon, 
  
  RepeatIcon,
  InfoIcon
} from '@chakra-ui/icons';

const OrderDetails = ({ isOpen, onClose, order, onStatusUpdate, isUpdating }) => {
  const toast = useToast();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const { 
    isOpen: isAlertOpen, 
    onOpen: onAlertOpen, 
    onClose: onAlertClose 
  } = useDisclosure();
  const cancelRef = React.useRef();

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = dateString?.toDate?.() || new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      cancelled: 'red',
    };
    return statusMap[status?.toLowerCase()] || 'yellow';
  };

  const calculateSubtotal = () => {
    return order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

  const handleStatusUpdate = (status) => {
    setSelectedStatus(status);
    onAlertOpen();
  };

  const confirmStatusUpdate = () => {
    onStatusUpdate(order.id, selectedStatus);
    onAlertClose();
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const handleEmailOrder = () => {
    toast({
      title: 'Order details sent',
      description: 'Order details have been emailed to the customer.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (!order) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderBottomWidth="1px">
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold">Order #{order.id?.slice(-6) || 'N/A'}</Text>
                <Text color="gray.600" fontSize="md">
                  Ordered on {formatDate(order.createdAt)}
                </Text>
              </VStack>
              <Badge colorScheme={getStatusColor(order.status)} fontSize="md" px={3} py={1}>
                {order.status?.toUpperCase() || 'PENDING'}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList mb="4">
                <Tab>Order Details</Tab>
                <Tab>Customer Info</Tab>
                <Tab>Timeline</Tab>
              </TabList>

              <TabPanels>
                {/* Order Details Panel */}
                <TabPanel>
                  {/* Order Summary Stats */}
                  <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={6}>
                    <Stat>
                      <StatLabel>Total Amount</StatLabel>
                      <StatNumber>Rs.{(order.total || 0).toFixed(2)}</StatNumber>
                      <StatHelpText>
                        <TimeIcon mr={1} />
                        {formatDate(order.createdAt)}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Items Count</StatLabel>
                      <StatNumber>{order.items?.length || 0}</StatNumber>
                      <StatHelpText>Total unique items</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Payment Status</StatLabel>
                      <StatNumber>
                        <Badge colorScheme={order.isPaid ? 'green' : 'red'}>
                          {order.isPaid ? 'PAID' : 'UNPAID'}
                        </Badge>
                      </StatNumber>
                      <StatHelpText>{order.paymentMethod || 'N/A'}</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Delivery Method</StatLabel>
                      <StatNumber fontSize="lg">{order.deliveryMethod || 'Standard'}</StatNumber>
                      <StatHelpText>{order.estimatedDelivery || 'N/A'}</StatHelpText>
                    </Stat>
                  </Grid>

                  {/* Order Items Table */}
                  <Box mb={6}>
                    <Table variant="simple">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th fontSize="md">Item Details</Th>
                          <Th isNumeric fontSize="md">Price</Th>
                          <Th isNumeric fontSize="md">Quantity</Th>
                          <Th isNumeric fontSize="md">Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {order.items?.map((item, index) => (
                          <Tr key={index} _hover={{ bg: 'gray.50' }}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="lg" fontWeight="semibold">
                                  {item.name || 'N/A'}
                                </Text>
                                {item.variant && (
                                  <Text fontSize="md" color="gray.600">
                                    Variant: {item.variant}
                                  </Text>
                                )}
                                {item.sku && (
                                  <Text fontSize="sm" color="gray.500">
                                    SKU: {item.sku}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td isNumeric fontSize="md">Rs.{(item.price || 0).toFixed(2)}</Td>
                            <Td isNumeric fontSize="md">{item.quantity || 1}</Td>
                            <Td isNumeric fontSize="md" fontWeight="semibold">
                              Rs.{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </Td>
                          </Tr>
                        ))}
                        {/* Summary Rows */}
                        <Tr>
                          <Td colSpan={3} textAlign="right">Subtotal:</Td>
                          <Td isNumeric>Rs.{calculateSubtotal().toFixed(2)}</Td>
                        </Tr>
                        {order.tax && (
                          <Tr>
                            <Td colSpan={3} textAlign="right">Tax ({order.taxRate || 0}%):</Td>
                            <Td isNumeric>Rs.{(order.tax || 0).toFixed(2)}</Td>
                          </Tr>
                        )}
                        {order.shipping && (
                          <Tr>
                            <Td colSpan={3} textAlign="right">Shipping:</Td>
                            <Td isNumeric>Rs.{(order.shipping || 0).toFixed(2)}</Td>
                          </Tr>
                        )}
                        <Tr fontWeight="bold">
                          <Td colSpan={3} textAlign="right">Total:</Td>
                          <Td isNumeric>Rs.{(order.total || 0).toFixed(2)}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>

                  {/* Order Notes */}
                  {order.notes && (
                    <Box mt={6} p={4} bg="gray.50" borderRadius="md">
                      <Text fontSize="md" fontWeight="bold" mb={2}>
                        Order Notes:
                      </Text>
                      <Text>{order.notes}</Text>
                    </Box>
                  )}
                </TabPanel>

                {/* Customer Info Panel */}
                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    {/* Billing Information */}
                    <Box>
                      <Text fontSize="xl" fontWeight="bold" mb={4}>Billing Information</Text>
                      <VStack align="start" spacing={2}>
                        <Text><strong>Name:</strong> {order.billing?.name || 'N/A'}</Text>
                        <Text><strong>Email:</strong> {order.billing?.email || 'N/A'}</Text>
                        <Text><strong>Phone:</strong> {order.billing?.phone || 'N/A'}</Text>
                        <Text><strong>Address:</strong> {order.billing?.address || 'N/A'}</Text>
                      </VStack>
                    </Box>

                    {/* Shipping Information */}
                    <Box>
                      <Text fontSize="xl" fontWeight="bold" mb={4}>Shipping Information</Text>
                      <VStack align="start" spacing={2}>
                        <Text><strong>Name:</strong> {order.shipping?.name || 'N/A'}</Text>
                        <Text><strong>Phone:</strong> {order.shipping?.phone || 'N/A'}</Text>
                        <Text><strong>Address:</strong> {order.shipping?.address || 'N/A'}</Text>
                        <Text><strong>Method:</strong> {order.shipping?.method || 'Standard'}</Text>
                      </VStack>
                    </Box>
                  </Grid>
                </TabPanel>

                {/* Timeline Panel */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    {order.timeline?.map((event, index) => (
                      <Box key={index} p={4} borderWidth="1px" borderRadius="md">
                        <HStack>
                          <Box color={getStatusColor(event.status)}>
                            {event.status === 'completed' ? <CheckIcon /> : 
                             event.status === 'cancelled' ? <CloseIcon /> : 
                             <TimeIcon />}
                          </Box>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{event.status}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {formatDate(event.timestamp)}
                            </Text>
                            {event.note && (
                              <Text fontSize="sm">{event.note}</Text>
                            )}
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" bg="gray.50">
            <HStack spacing={4}>
              {/* Action Buttons */}
              <Button
                
                variant="outline"
                onClick={handlePrintOrder}
              >
                Print
              </Button>
              <Button
                leftIcon={<EmailIcon />}
                variant="outline"
                onClick={handleEmailOrder}
              >
                Email
              </Button>
              <Button
                leftIcon={<CloseIcon />}
                colorScheme="red"
                onClick={() => handleStatusUpdate('cancelled')}
                isLoading={isUpdating}
              >
                Reject
              </Button>
              <Button
                leftIcon={<CheckIcon />}
                colorScheme="green"
                onClick={() => handleStatusUpdate('processing')}
                isLoading={isUpdating}
              >
                Accept
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Status Update
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to mark this order as {selectedStatus}?
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                Cancel
              </Button>
              <Button
                colorScheme={selectedStatus === 'cancelled' ? 'red' : 'green'}
                onClick={confirmStatusUpdate}
                ml={3}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default OrderDetails;