import React, { useState, useCallback } from 'react';
import { 
  Button, 
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  VStack,
  useDisclosure,
  Text,
  Box
} from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const SalesAnalytics = ({ orders }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [exportType, setExportType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const generateSalesReport = useCallback((timeframe, date) => {
    // Filter orders based on timeframe and selected date
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      if (timeframe === 'day') {
        const selectedDateTime = new Date(date);
        return orderDate.toDateString() === selectedDateTime.toDateString();
      } else if (timeframe === 'month') {
        const [year, month] = date.split('-');
        return orderDate.getMonth() === parseInt(month) - 1 && 
               orderDate.getFullYear() === parseInt(year);
      }
      return false;
    });

    if (filteredOrders.length === 0) {
      toast({
        title: 'No Data',
        description: `No orders found for the selected ${timeframe}`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Aggregate item sales
    const itemSales = {};
    let totalRevenue = 0;
    let totalOrders = 0;

    filteredOrders.forEach(order => {
      if (order.status !== 'cancelled') {
        totalOrders++;
        order.items.forEach(item => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = {
              quantity: 0,
              revenue: 0,
              unitPrice: item.price,
              orderCount: 0
            };
          }
          itemSales[item.name].quantity += item.quantity;
          itemSales[item.name].revenue += item.price * item.quantity;
          itemSales[item.name].orderCount++;
          totalRevenue += item.price * item.quantity;
        });
      }
    });

    // Convert to array and sort by quantity
    const salesData = Object.entries(itemSales).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      revenue: data.revenue,
      orderCount: data.orderCount,
      averagePerOrder: (data.quantity / data.orderCount).toFixed(2)
    })).sort((a, b) => b.quantity - a.quantity);

    // Create worksheet data
    const reportDate = timeframe === 'day' 
      ? new Date(date).toLocaleDateString()
      : new Date(date + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

    const worksheetData = [
      ['Sales Report', timeframe === 'day' ? 'Daily' : 'Monthly', reportDate],
      ['Total Orders:', totalOrders],
      ['Total Revenue:', `$${totalRevenue.toFixed(2)}`],
      [],
      ['Detailed Sales Analysis'],
      ['Item Name', 'Quantity Sold', 'Unit Price ($)', 'Total Revenue ($)', 'Number of Orders', 'Avg. Quantity per Order'],
      ...salesData.map(item => [
        item.name,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.revenue.toFixed(2),
        item.orderCount,
        item.averagePerOrder
      ]),
      [],
      ['Top Performing Items'],
      ['Rank', 'Item Name', 'Quantity Sold', 'Revenue ($)'],
      ...salesData.slice(0, 5).map((item, index) => [
        index + 1,
        item.name,
        item.quantity,
        item.revenue.toFixed(2)
      ])
    ];

    // Create and download Excel file
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    
    // Style the worksheet
    ws['!cols'] = [
      { wch: 30 }, // Item name
      { wch: 15 }, // Quantity
      { wch: 15 }, // Unit Price
      { wch: 15 }, // Revenue
      { wch: 15 }, // Order Count
      { wch: 20 }  // Avg per Order
    ];
    
    // Generate filename
    const dateStr = timeframe === 'day' 
      ? new Date(date).toISOString().split('T')[0]
      : date;
    const filename = `sales_report_${timeframe}_${dateStr}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);

    toast({
      title: 'Report Generated',
      description: `Sales report for ${reportDate} has been downloaded`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    onClose();
  }, [orders, toast, onClose]);

  const handleExportClick = (type) => {
    setExportType(type);
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedYear('');
    onOpen();
  };

  const handleExport = () => {
    if (exportType === 'day') {
      if (!selectedDate) {
        toast({
          title: 'Error',
          description: 'Please select a date',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      generateSalesReport('day', selectedDate);
    } else {
      if (!selectedMonth || !selectedYear) {
        toast({
          title: 'Error',
          description: 'Please select both month and year',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      generateSalesReport('month', `${selectedYear}-${selectedMonth}`);
    }
  };

  return (
    <Box>
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDown />} colorScheme="blue">
          Export Sales Report
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => handleExportClick('day')}>
            Export Daily Report
          </MenuItem>
          <MenuItem onClick={() => handleExportClick('month')}>
            Export Monthly Report
          </MenuItem>
        </MenuList>
      </Menu>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Export {exportType === 'day' ? 'Daily' : 'Monthly'} Sales Report
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {exportType === 'day' ? (
                <FormControl isRequired>
                  <FormLabel>Select Date</FormLabel>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
              ) : (
                <>
                  <FormControl isRequired>
                    <FormLabel>Select Year</FormLabel>
                    <Select
                      placeholder="Select Year"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {Array.from({ length: 5 }, (_, i) => 
                        new Date().getFullYear() - i
                      ).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Select Month</FormLabel>
                    <Select
                      placeholder="Select Month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={month} value={month}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        );
                      })}
                    </Select>
                  </FormControl>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleExport}>
              Generate Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SalesAnalytics;