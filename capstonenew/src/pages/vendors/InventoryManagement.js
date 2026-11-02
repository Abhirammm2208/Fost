import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Input,
  Badge,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  Timestamp,
  orderBy
} from "firebase/firestore";
import { app } from "../../Components/firebase/Firebase";

const InventoryManagement = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const firestore = getFirestore(app);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setError("No user found");
      setLoading(false);
      return;
    }

    const user = JSON.parse(userStr);
    
    // Set up real-time listener for items
    const itemsRef = collection(firestore, "items");
    const itemsQuery = query(
      itemsRef,
      where("vendorId", "==", user.uid)
    );
    
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const itemsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        stockQuantity: doc.data().stockQuantity || 0,
        lowStockThreshold: doc.data().lowStockThreshold || 5,
      }));
      setItems(itemsList);
      setLoading(false);
    });

    // Set up real-time listener for orders
    const ordersRef = collection(firestore, "orders");
    const ordersQuery = query(
      ordersRef,
      where("vendorId", "==", user.uid),
      where("stockUpdated", "==", false),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const order = { ...change.doc.data(), id: change.doc.id };
          if (!order.stockUpdated && order.status === "confirmed") {
            handleOrderStockUpdate(order);
          }
        }
      });
    });

    return () => {
      unsubscribeItems();
      unsubscribeOrders();
    };
  }, []);

  const handleOrderStockUpdate = async (order) => {
    try {
      // Process each item in the order
      for (const orderItem of order.items) {
        const itemRef = doc(firestore, "items", orderItem.id);
        
        // Get the latest item data directly from Firestore
        const itemSnapshot = await getDocs(doc(firestore, "items", orderItem.id));
        const currentItem = itemSnapshot.data();
        
        if (!currentItem) {
          console.warn(`Item not found: ${orderItem.id}`);
          continue;
        }

        // Calculate new quantity, ensuring it doesn't go below 0
        const newQuantity = Math.max(0, currentItem.stockQuantity - orderItem.quantity);
        
        // Update in Firestore
        await updateDoc(itemRef, {
          stockQuantity: newQuantity,
          isActive: newQuantity > 0,
          updatedAt: Timestamp.now()
        });
      }

      // Mark order as processed for stock updates
      const orderRef = doc(firestore, "orders", order.id);
      await updateDoc(orderRef, { 
        stockUpdated: true,
        updatedAt: Timestamp.now()
      });

      toast({
        title: "Stock Updated",
        description: `Inventory updated for order ${order.id}`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock from order",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateStock = async (itemId, newQuantity, threshold) => {
    try {
      const itemRef = doc(firestore, "items", itemId);
      const updateData = {
        stockQuantity: newQuantity,
        lowStockThreshold: threshold,
        isActive: newQuantity > 0,
        updatedAt: Timestamp.now()
      };

      await updateDoc(itemRef, updateData);

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...updateData
              }
            : item
        )
      );

      toast({
        title: "Success",
        description: "Stock updated successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error("Error in manual stock update:", error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openStockEditModal = (item) => {
    setSelectedItem(item);
    onOpen();
  };

  const handleStockUpdate = () => {
    if (selectedItem) {
      updateStock(
        selectedItem.id,
        selectedItem.stockQuantity,
        selectedItem.lowStockThreshold
      );
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (quantity, threshold) => {
    if (quantity <= 0) return { status: "Out of Stock", color: "red" };
    if (quantity <= threshold) return { status: "Low Stock", color: "orange" };
    return { status: "In Stock", color: "green" };
  };

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="xl">Inventory Management</Heading>

        <InputGroup>
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <InputRightElement>
            <SearchIcon color="gray.500" />
          </InputRightElement>
        </InputGroup>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Item Name</Th>
              <Th>Category</Th>
              <Th>Price (Rs)</Th>
              <Th>Stock Quantity</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredItems.map((item) => {
              const stockStatus = getStockStatus(
                item.stockQuantity,
                item.lowStockThreshold
              );
              return (
                <Tr key={item.id}>
                  <Td>{item.name}</Td>
                  <Td>{item.category}</Td>
                  <Td>{item.price.toFixed(2)}</Td>
                  <Td>{item.stockQuantity}</Td>
                  <Td>
                    <Badge colorScheme={stockStatus.color}>
                      {stockStatus.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => openStockEditModal(item)}
                    >
                      Update Stock
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Update Stock</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedItem && (
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Stock Quantity</FormLabel>
                    <Input
                      type="number"
                      value={selectedItem.stockQuantity}
                      onChange={(e) =>
                        setSelectedItem({
                          ...selectedItem,
                          stockQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <Input
                      type="number"
                      value={selectedItem.lowStockThreshold}
                      onChange={(e) =>
                        setSelectedItem({
                          ...selectedItem,
                          lowStockThreshold: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </FormControl>
                  <Button
                    colorScheme="blue"
                    width="full"
                    onClick={handleStockUpdate}
                  >
                    Update
                  </Button>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default InventoryManagement;