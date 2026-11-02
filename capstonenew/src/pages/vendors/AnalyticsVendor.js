// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Container,
//   SimpleGrid,
//   Stat,
//   StatLabel,
//   StatNumber,
//   Heading,
//   Select,
//   useColorModeValue,
//   Icon,
//   Flex,
//   Spinner,
//   Text
// } from '@chakra-ui/react';
// import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer
// } from 'recharts';
// import { FiPackage, FiDollarSign, FiClock, FiCheck, FiX } from 'react-icons/fi';

// const StatCard = ({ title, value, icon, bgGradient }) => {
//   const cardBg = useColorModeValue('white', 'gray.800');
  
//   return (
//     <Box
//       p={6}
//       bg={cardBg}
//       rounded="xl"
//       boxShadow="sm"
//       position="relative"
//       overflow="hidden"
//     >
//       <Flex justifyContent="space-between" alignItems="center">
//         <Stat>
//           <StatLabel fontSize="sm" color="gray.500">{title}</StatLabel>
//           <StatNumber fontSize="3xl" fontWeight="bold">{value}</StatNumber>
//         </Stat>
//         <Icon
//           as={icon}
//           w={8}
//           h={8}
//           color={useColorModeValue('blue.500', 'blue.300')}
//         />
//       </Flex>
//     </Box>
//   );
// };

// const AnalyticsDashboard = () => {
//   const [timeFilter, setTimeFilter] = useState('today');
//   const [loading, setLoading] = useState(true);
//   const [analytics, setAnalytics] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     pendingOrders: 0,
//     deliveredOrders: 0,
//     cancelledOrders: 0,
//     hourlyRevenue: []
//   });

//   const getTimeConstraints = (filter) => {
//     const now = new Date();
//     const startOfDay = new Date(now);
//     startOfDay.setHours(0, 0, 0, 0);

//     const startOfWeek = new Date(now);
//     startOfWeek.setDate(now.getDate() - now.getDay());
//     startOfWeek.setHours(0, 0, 0, 0);

//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//     switch (filter) {
//       case 'today':
//         return Timestamp.fromDate(startOfDay);
//       case 'week':
//         return Timestamp.fromDate(startOfWeek);
//       case 'month':
//         return Timestamp.fromDate(startOfMonth);
//       default:
//         return Timestamp.fromDate(startOfDay);
//     }
//   };
  
//   const fetchAnalytics = async () => {
//     setLoading(true);
//     const firestore = getFirestore();
//     try {
//       const user = JSON.parse(localStorage.getItem('user'));
//       if (!user?.shopId) {
//         console.error('No shop ID found');
//         setLoading(false);
//         return;
//       }

//       const ordersRef = collection(firestore, 'orders');
//       const startDate = getTimeConstraints(timeFilter);
      
//       const q = query(
//         ordersRef,
//         where('shopId', '==', user.shopId),
//         where('createdAt', '>=', startDate)
//       );
      
//       const snapshot = await getDocs(q);
//       console.log(`Fetched ${snapshot.size} orders`);
      
//       // Initialize analytics data
//       let totalOrders = 0;
//       let totalRevenue = 0;
//       let pending = 0;
//       let delivered = 0;
//       let cancelled = 0;
//       const hourlyData = new Array(24).fill(0);
      
//       snapshot.forEach(doc => {
//         const order = doc.data();
//         totalOrders++;
        
//         // Handle different possible revenue field names
//         const orderAmount = order.totalAmount || order.total || 0;
//         totalRevenue += parseFloat(orderAmount);
        
//         // Count by status
//         switch (order.status) {
//           case 'pending':
//             pending++;
//             break;
//           case 'picked_up':
//           case 'delivered':
//             delivered++;
//             break;
//           case 'cancelled':
//             cancelled++;
//             break;
//         }
        
//         // Add to hourly data - handle both Timestamp and regular Date objects
//         const orderDate = order.createdAt instanceof Timestamp 
//           ? order.createdAt.toDate() 
//           : new Date(order.createdAt);
          
//         const hour = orderDate.getHours();
//         hourlyData[hour] += parseFloat(orderAmount);
//       });
      
//       // Format hourly data for chart
//       const hourlyRevenue = hourlyData.map((amount, hour) => ({
//         hour: `${hour.toString().padStart(2, '0')}:00`,
//         revenue: parseFloat(amount.toFixed(2))
//       }));
      
//       setAnalytics({
//         totalOrders,
//         totalRevenue: parseFloat(totalRevenue.toFixed(2)),
//         pendingOrders: pending,
//         deliveredOrders: delivered,
//         cancelledOrders: cancelled,
//         hourlyRevenue
//       });
      
//     } catch (error) {
//       console.error('Error fetching analytics:', error);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   useEffect(() => {
//     fetchAnalytics();
//     const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
//     return () => clearInterval(interval);
//   }, [timeFilter]);

//   if (loading) {
//     return (
//       <Container maxW="container.xl" py={8}>
//         <Flex justify="center" align="center" height="400px">
//           <Spinner size="xl" />
//         </Flex>
//       </Container>
//     );
//   }

//   return (
//     <Container maxW="container.xl" py={8}>
//       <Flex justify="space-between" align="center" mb={8}>
//         <Heading size="lg">Dashboard Analytics</Heading>
//         <Select
//           width="200px"
//           value={timeFilter}
//           onChange={(e) => setTimeFilter(e.target.value)}
//         >
//           <option value="today">Today</option>
//           <option value="week">This Week</option>
//           <option value="month">This Month</option>
//         </Select>
//       </Flex>

//       <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6} mb={8}>
//         <StatCard
//           title="Total Orders"
//           value={analytics.totalOrders}
//           icon={FiPackage}
//         />
//         <StatCard
//           title="Total Revenue"
//           value={`$${analytics.totalRevenue.toFixed(2)}`}
//           icon={FiDollarSign}
//         />
//         <StatCard
//           title="Pending"
//           value={analytics.pendingOrders}
//           icon={FiClock}
//         />
//         <StatCard
//           title="Delivered"
//           value={analytics.deliveredOrders}
//           icon={FiCheck}
//         />
//         <StatCard
//           title="Cancelled"
//           value={analytics.cancelledOrders}
//           icon={FiX}
//         />
//       </SimpleGrid>

//       <Box
//         bg="white"
//         p={6}
//         rounded="xl"
//         boxShadow="sm"
//         height="400px"
//       >
//         <Heading size="md" mb={4}>Revenue by Hour</Heading>
//         {analytics.hourlyRevenue.length > 0 ? (
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={analytics.hourlyRevenue}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="hour" />
//               <YAxis />
//               <Tooltip formatter={(value) => `$${value}`} />
//               <Bar dataKey="revenue" fill="#4299E1" />
//             </BarChart>
//           </ResponsiveContainer>
//         ) : (
//           <Flex justify="center" align="center" height="100%">
//             <Text color="gray.500">No revenue data available</Text>
//           </Flex>
//         )}
//       </Box>
//     </Container>
//   );
// };

// export default AnalyticsDashboard;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Heading,
  Select,
  useColorModeValue,
  Icon,
  Flex,
  Spinner,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { FiPackage, FiDollarSign, FiClock, FiCheck, FiX, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// Existing StatCard component remains the same...
const StatCard = ({ title, value, icon, bgGradient }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  return (
    <Box
      p={6}
      bg={cardBg}
      rounded="xl"
      boxShadow="sm"
      position="relative"
      overflow="hidden"
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Stat>
          <StatLabel fontSize="sm" color="gray.500">{title}</StatLabel>
          <StatNumber fontSize="3xl" fontWeight="bold">{value}</StatNumber>
        </Stat>
        <Icon
          as={icon}
          w={8}
          h={8}
          color={useColorModeValue('blue.500', 'blue.300')}
        />
      </Flex>
    </Box>
  );
};

// New helper functions for data processing
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getOrderStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
};

const generateExcelData = (orders, timeFilter) => {
  // Sheet 1: Order Details
  const orderDetails = orders.map(order => ({
    'Order ID': order.id || '',
    'Date': formatDate(order.createdAt.toDate()),
    'Status': getOrderStatusText(order.status),
    'Total Amount': `$${order.totalAmount || order.total || 0}`,
    'Customer Name': order.customerName || 'N/A',
    'Items Count': (order.items || []).length,
    'Payment Method': order.paymentMethod || 'N/A'
  }));

  // Sheet 2: Hourly Analysis
  const hourlyData = new Array(24).fill(0).map((_, hour) => ({
    'Hour': `${hour.toString().padStart(2, '0')}:00`,
    'Orders': 0,
    'Revenue': 0
  }));

  orders.forEach(order => {
    const hour = order.createdAt.toDate().getHours();
    hourlyData[hour].Orders++;
    hourlyData[hour].Revenue += parseFloat(order.totalAmount || order.total || 0);
  });

  // Sheet 3: Status Summary
  const statusSummary = {
    pending: { count: 0, revenue: 0 },
    picked_up: { count: 0, revenue: 0 },
    delivered: { count: 0, revenue: 0 },
    cancelled: { count: 0, revenue: 0 }
  };

  orders.forEach(order => {
    const status = order.status;
    if (statusSummary[status]) {
      statusSummary[status].count++;
      statusSummary[status].revenue += parseFloat(order.totalAmount || order.total || 0);
    }
  });

  const statusDetails = Object.entries(statusSummary).map(([status, data]) => ({
    'Status': getOrderStatusText(status),
    'Order Count': data.count,
    'Total Revenue': `$${data.revenue.toFixed(2)}`,
    'Percentage': `${((data.count / orders.length) * 100).toFixed(1)}%`
  }));

  return {
    orderDetails,
    hourlyData,
    statusDetails
  };
};

const exportToExcel = (data, timeFilter) => {
  const wb = XLSX.utils.book_new();
  const timeRange = timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1);

  // Add Order Details sheet
  const wsOrders = XLSX.utils.json_to_sheet(data.orderDetails);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Order Details');

  // Add Hourly Analysis sheet
  const wsHourly = XLSX.utils.json_to_sheet(data.hourlyData);
  XLSX.utils.book_append_sheet(wb, wsHourly, 'Hourly Analysis');

  // Add Status Summary sheet
  const wsStatus = XLSX.utils.json_to_sheet(data.statusDetails);
  XLSX.utils.book_append_sheet(wb, wsStatus, 'Status Summary');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `Analytics_${timeRange}_${timestamp}.xlsx`;

  // Save the file
  XLSX.writeFile(wb, fileName);
};

const AnalyticsDashboard = () => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    hourlyRevenue: []
  });

  // ... existing getTimeConstraints function remains the same ...
  const getTimeConstraints = (filter) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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

  const fetchAnalytics = async () => {
    setLoading(true);
    const firestore = getFirestore();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.shopId) {
        console.error('No shop ID found');
        setLoading(false);
        return;
      }

      const ordersRef = collection(firestore, 'orders');
      const startDate = getTimeConstraints(timeFilter);
      
      const q = query(
        ordersRef,
        where('shopId', '==', user.shopId),
        where('createdAt', '>=', startDate)
      );
      
      const snapshot = await getDocs(q);
      const orders = [];
      
      // Initialize analytics data
      let totalOrders = 0;
      let totalRevenue = 0;
      let pending = 0;
      let delivered = 0;
      let cancelled = 0;
      const hourlyData = new Array(24).fill(0);
      
      snapshot.forEach(doc => {
        const order = { id: doc.id, ...doc.data() };
        orders.push(order);
        
        totalOrders++;
        const orderAmount = order.totalAmount || order.total || 0;
        totalRevenue += parseFloat(orderAmount);
        
        switch (order.status) {
          case 'pending':
            pending++;
            break;
          case 'picked_up':
          case 'delivered':
            delivered++;
            break;
          case 'cancelled':
            cancelled++;
            break;
        }
        
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt);
          
        const hour = orderDate.getHours();
        hourlyData[hour] += parseFloat(orderAmount);
      });
      
      const hourlyRevenue = hourlyData.map((amount, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        revenue: parseFloat(amount.toFixed(2))
      }));
      
      setRawOrders(orders);
      setAnalytics({
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        pendingOrders: pending,
        deliveredOrders: delivered,
        cancelledOrders: cancelled,
        hourlyRevenue
      });
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const excelData = generateExcelData(rawOrders, timeFilter);
    exportToExcel(excelData, timeFilter);
  };
  
  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
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
        <Heading size="lg">Dashboard Analytics</Heading>
        <Flex gap={4}>
          <Select
            width="200px"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </Select>
          <Button
            leftIcon={<FiDownload />}
            colorScheme="blue"
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6} mb={8}>
        <StatCard
          title="Total Orders"
          value={analytics.totalOrders}
          icon={FiPackage}
        />
        <StatCard
          title="Total Revenue"
          value={`Rs.${analytics.totalRevenue.toFixed(2)}`}
          
        />
        <StatCard
          title="Pending"
          value={analytics.pendingOrders}
          icon={FiClock}
        />
        <StatCard
          title="Delivered"
          value={analytics.deliveredOrders}
          icon={FiCheck}
        />
        <StatCard
          title="Cancelled"
          value={analytics.cancelledOrders}
          icon={FiX}
        />
      </SimpleGrid>

      <Box
        bg="white"
        p={6}
        rounded="xl"
        boxShadow="sm"
        height="400px"
      >
        <Heading size="md" mb={4}>Revenue by Hour</Heading>
        {analytics.hourlyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.hourlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="revenue" fill="#4299E1" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Flex justify="center" align="center" height="100%">
            <Text color="gray.500">No revenue data available</Text>
          </Flex>
        )}
      </Box>
    </Container>
  );
};

export default AnalyticsDashboard;