import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Flex,
  Icon,
  useColorModeValue,
  Select,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FiTrendingUp, FiClock, FiCalendar } from 'react-icons/fi';

// Custom calendar heatmap component
const CalendarHeatmap = ({ data }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const getIntensityColor = (value, maxValue) => {
    const intensity = Math.min((value / maxValue) * 0.8 + 0.2, 1);
    return `rgba(66, 153, 225, ${intensity})`;
  };

  return (
    <Box p={4} bg="white" rounded="xl" boxShadow="sm">
      <Heading size="sm" mb={4}>Weekly Activity Pattern</Heading>
      <SimpleGrid columns={7} spacing={2}>
        {days.map(day => (
          <Box key={day} textAlign="center" fontSize="sm" fontWeight="medium" color="gray.600">
            {day}
          </Box>
        ))}
        {data.map((value, index) => (
          <Box
            key={index}
            h="40px"
            bg={getIntensityColor(value.value, Math.max(...data.map(d => d.value)))}
            rounded="md"
            position="relative"
            _hover={{
              cursor: 'pointer',
            }}
          >
            <Box
              position="absolute"
              bottom="100%"
              left="50%"
              transform="translateX(-50%)"
              bg="gray.800"
              color="white"
              px={2}
              py={1}
              rounded="md"
              fontSize="xs"
              opacity="0"
              _hover={{ opacity: 1 }}
              transition="opacity 0.2s"
            >
              {value.value} orders
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

// Top products card component
const TopProductsCard = ({ products }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box p={6} bg={bgColor} rounded="xl" boxShadow="sm">
      <Flex align="center" mb={4}>
        <Icon as={FiTrendingUp} mr={2} />
        <Heading size="sm">Top Selling Products</Heading>
      </Flex>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Rank</Th>
            <Th>Product</Th>
            <Th isNumeric>Units Sold</Th>
            <Th isNumeric>Revenue</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product, index) => (
            <Tr key={product.name}>
              <Td>
                <Badge
                  colorScheme={index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}
                  px={2}
                  rounded="full"
                >
                  #{index + 1}
                </Badge>
              </Td>
              <Td fontWeight="medium">{product.name}</Td>
              <Td isNumeric>{product.unitsSold}</Td>
              <Td isNumeric>${product.revenue.toFixed(2)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

// Peak hours visualization component
const PeakHoursCard = ({ data }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box p={6} bg={bgColor} rounded="xl" boxShadow="sm" height="300px">
      <Flex align="center" mb={4}>
        <Icon as={FiClock} mr={2} />
        <Heading size="sm">Peak Hours Analysis</Heading>
      </Flex>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="orders" 
            stroke="#4299E1" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

const AdvancedAnalytics = () => {
  const [timeFilter, setTimeFilter] = useState('week');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    topProducts: [],
    peakHours: [],
    weeklyPattern: [],
    totalOrders: 0
  });

  const processOrders = (orders) => {
    // Process top products
    const productMap = new Map();
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const existing = productMap.get(item.name) || { 
          name: item.name, 
          unitsSold: 0, 
          revenue: 0 
        };
        existing.unitsSold += item.quantity || 1;
        existing.revenue += (item.price || 0) * (item.quantity || 1);
        productMap.set(item.name, existing);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Process peak hours
    const hourCounts = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = order.createdAt.toDate().getHours();
      hourCounts[hour]++;
    });

    const peakHours = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      orders: count
    }));

    // Process weekly pattern
    const dayCounts = new Array(7).fill(0);
    orders.forEach(order => {
      const day = order.createdAt.toDate().getDay();
      dayCounts[day]++;
    });

    const weeklyPattern = dayCounts.map((value, index) => ({
      day: index,
      value
    }));

    return {
      topProducts,
      peakHours,
      weeklyPattern,
      totalOrders: orders.length
    };
  };

  const fetchData = async () => {
    setLoading(true);
    const firestore = getFirestore();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.shopId) {
        throw new Error('No shop ID found');
      }

      const ordersRef = collection(firestore, 'orders');
      const startDate = getTimeConstraints(timeFilter);
      
      const q = query(
        ordersRef,
        where('shopId', '==', user.shopId),
        where('createdAt', '>=', startDate)
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const processedData = processOrders(orders);
      setAnalytics(processedData);
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeConstraints = (filter) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return Timestamp.fromDate(startOfDay);
      case 'week':
        return Timestamp.fromDate(startOfWeek);
      case 'month':
        return Timestamp.fromDate(startOfMonth);
      default:
        return Timestamp.fromDate(startOfDay);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [timeFilter]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" height="400px">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Advanced Analytics</Heading>
        <Select
          width="200px"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </Select>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <TopProductsCard products={analytics.topProducts} />
        <PeakHoursCard data={analytics.peakHours} />
      </SimpleGrid>

      <CalendarHeatmap data={analytics.weeklyPattern} />
    </Container>
  );
};

export default AdvancedAnalytics;