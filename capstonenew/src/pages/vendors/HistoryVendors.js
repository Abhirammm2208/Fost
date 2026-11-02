import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  Select,
  Flex,
  Button,
  Text,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid
} from '@chakra-ui/react';
import {
  Search,
  Calendar,
  Download,
  Filter,
  MoreVertical,
  Eye,
  Printer,
  Mail,
  FileText
} from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    cancelledOrders: 0
  });

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const statusColors = {
    pending: 'yellow',
    processing: 'blue',
    delivered: 'green',
    cancelled: 'red',
    refunded: 'purple'
  };

  const fetchOrders = async () => {
    setLoading(true);
    const firestore = getFirestore();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.shopId) {
        throw new Error('No shop ID found');
      }

      const ordersRef = collection(firestore, 'orders');
      let q = query(ordersRef, where('shopId', '==', user.shopId));

      // Apply date range filter
      if (dateRange !== 'all') {
        const startDate = getDateRangeStart(dateRange);
        q = query(q, where('createdAt', '>=', startDate));
      }

      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      // Calculate statistics
      const stats = calculateStatistics(fetchedOrders);
      setStatistics(stats);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error fetching orders',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (orderList) => {
    const stats = orderList.reduce((acc, order) => {
      acc.totalOrders++;
      acc.totalRevenue += parseFloat(order.totalAmount || 0);
      if (order.status === 'cancelled') acc.cancelledOrders++;
      return acc;
    }, {
      totalOrders: 0,
      totalRevenue: 0,
      cancelledOrders: 0
    });

    stats.averageOrderValue = stats.totalOrders > 0 
      ? stats.totalRevenue / stats.totalOrders 
      : 0;

    return stats;
  };

  const getDateRangeStart = (range) => {
    const now = new Date();
    switch (range) {
      case 'today':
        return Timestamp.fromDate(new Date(now.setHours(0, 0, 0, 0)));
      case 'week':
        now.setDate(now.getDate() - 7);
        return Timestamp.fromDate(now);
      case 'month':
        now.setMonth(now.getMonth() - 1);
        return Timestamp.fromDate(now);
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        return Timestamp.fromDate(now);
      default:
        return null;
    }
  };

  const exportToExcel = () => {
    const exportData = orders.map(order => ({
      'Order ID': order.id,
      'Date': order.createdAt?.toLocaleString(),
      'Customer': order.customerName,
      'Items': (order.items || []).map(item => `${item.name} x${item.quantity}`).join(', '),
      'Total Amount': `$${order.totalAmount}`,
      'Status': order.status,
      'Payment Method': order.paymentMethod,
      'Delivery Address': order.deliveryAddress
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order #${order.id}</h1>
            <p>Date: ${order.createdAt?.toLocaleString()}</p>
          </div>
          <div class="details">
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Address:</strong> ${order.deliveryAddress}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>Rs.${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <h3>Total: Rs.${order.totalAmount}</h3>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchOrders();
  }, [dateRange]);

  return (
    <Container maxW="container.xl" py={8}>
      <Box bg={bgColor} p={6} rounded="lg" shadow="sm" borderWidth="1px" borderColor={borderColor}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg">Order History</Heading>
          <Button
            leftIcon={<Download />}
            colorScheme="blue"
            onClick={exportToExcel}
          >
            Export to Excel
          </Button>
        </Flex>

        {/* Statistics Section */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          <Stat>
            <StatLabel>Total Orders</StatLabel>
            <StatNumber>{statistics.totalOrders}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Revenue</StatLabel>
            <StatNumber>Rs.{statistics.totalRevenue.toFixed(2)}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Average Order Value</StatLabel>
            <StatNumber>Rs.{statistics.averageOrderValue.toFixed(2)}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Cancelled Orders</StatLabel>
            <StatNumber>{statistics.cancelledOrders}</StatNumber>
            <StatHelpText>
              ({((statistics.cancelledOrders / statistics.totalOrders) * 100).toFixed(1)}%)
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filters Section */}
        <Flex gap={4} mb={6} flexWrap="wrap">
          <Input
            placeholder="Search by order ID or customer name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            width={{ base: "100%", md: "300px" }}
            leftIcon={<Search />}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            width={{ base: "100%", md: "200px" }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </Select>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            width={{ base: "100%", md: "200px" }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </Select>
        </Flex>

        {/* Orders Table */}
        {loading ? (
          <Flex justify="center" py={8}>
            <Spinner size="xl" />
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Order ID</Th>
                  <Th>Date</Th>
                  <Th>Customer</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.map((order) => (
                  <Tr key={order.id}>
                    <Td fontWeight="medium">{order.id}</Td>
                    <Td>{order.createdAt?.toLocaleString()}</Td>
                    <Td>{order.customerName}</Td>
                    <Td>
                      <Text noOfLines={1}>
                        {(order.items || []).map(item => `${item.name} x${item.quantity}`).join(', ')}
                      </Text>
                    </Td>
                    <Td>Rs.{order.totalAmount}</Td>
                    <Td>
                      <Badge colorScheme={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={16} />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem icon={<Eye size={16} />} onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}>
                            View Details
                          </MenuItem>
                          <MenuItem icon={<Printer size={16} />} onClick={() => printOrder(order)}>
                            Print Order
                          </MenuItem>
                          <MenuItem icon={<Mail size={16} />} onClick={() => {
                            // Email functionality
                          }}>
                            Email Invoice
                          </MenuItem>
                          <MenuItem icon={<FileText size={16} />} onClick={() => {
                            // Download invoice
                          }}>
                            Download Invoice
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Order Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Order Details #{selectedOrder?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedOrder && (
              <Stack spacing={4}>
                <Box>
                  <Text fontWeight="bold">Customer Information</Text>
                  <Text>Name: {selectedOrder.customerName}</Text>
                  <Text>Address: {selectedOrder.deliveryAddress}</Text>
                  <Text>Phone: {selectedOrder.customerPhone}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Order Items</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>Quantity</Th>
                        <Th>Price</Th>
                        <Th>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(selectedOrder.items || []).map((item, index) => (
                        <Tr key={index}>
                          <Td>{item.name}</Td>
                          <Td>{item.quantity}</Td>
                          <Td>Rs.{item.price}</Td>
                          <Td>Rs.{(item.price * item.quantity).toFixed(2)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                <Box>
                <Text fontWeight="bold">Order Summary</Text>
                  <Stack spacing={2}>
                    <Flex justify="space-between">
                      <Text>Subtotal:</Text>
                      <Text>Rs.{selectedOrder.subtotal?.toFixed(2) || '0.00'}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text>Shipping:</Text>
                      <Text>Rs.{selectedOrder.shippingCost?.toFixed(2) || '0.00'}</Text>
                    </Flex>
                    {selectedOrder.discount && (
                      <Flex justify="space-between">
                        <Text>Discount:</Text>
                        <Text color="green.500">-${selectedOrder.discount.toFixed(2)}</Text>
                      </Flex>
                    )}
                    <Flex justify="space-between" fontWeight="bold">
                      <Text>Total:</Text>
                      <Text>Rs.{selectedOrder.totalAmount}</Text>
                    </Flex>
                  </Stack>
                </Box>
                <Box>
                  <Text fontWeight="bold">Additional Information</Text>
                  <Stack spacing={2}>
                    <Flex>
                      <Text width="150px">Order Date:</Text>
                      <Text>{selectedOrder.createdAt?.toLocaleString()}</Text>
                    </Flex>
                    <Flex>
                      <Text width="150px">Payment Method:</Text>
                      <Text>{selectedOrder.paymentMethod}</Text>
                    </Flex>
                    <Flex>
                      <Text width="150px">Payment Status:</Text>
                      <Badge colorScheme={selectedOrder.isPaid ? 'green' : 'red'}>
                        {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </Flex>
                    <Flex>
                      <Text width="150px">Order Status:</Text>
                      <Badge colorScheme={statusColors[selectedOrder.status]}>
                        {selectedOrder.status}
                      </Badge>
                    </Flex>
                    {selectedOrder.notes && (
                      <Box>
                        <Text width="150px" fontWeight="bold">Notes:</Text>
                        <Text mt={1}>{selectedOrder.notes}</Text>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default OrderHistory;