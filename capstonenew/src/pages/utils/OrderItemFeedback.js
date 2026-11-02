import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Text,
  HStack,
  Skeleton,
  Flex,
  Badge,
  Tooltip,
  Button,
  useToast
} from '@chakra-ui/react';
import { Star, TrendingUp, ThumbsUp } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const OrderItemFeedback = ({ orderDetails }) => {
  const [itemsWithRatings, setItemsWithRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredRatings, setHoveredRatings] = useState({});
  const [selectedRatings, setSelectedRatings] = useState({});
  const firestore = getFirestore();
  const toast = useToast();

  useEffect(() => {
    const fetchItemRatings = async () => {
      if (!orderDetails?.items?.length) return;

      try {
        const ratingPromises = orderDetails.items.map(async (item) => {
          const itemRef = doc(firestore, 'items', item.id);
          const itemDoc = await getDoc(itemRef);
          
          if (itemDoc.exists()) {
            const data = itemDoc.data();
            return {
              ...item,
              averageRating: data.averageRating || 0,
              totalRatings: (data.ratings || []).length,
              ratings: data.ratings || []
            };
          }
          return item;
        });

        const itemsWithRatingData = await Promise.all(ratingPromises);
        const ratingsMap = {};
        itemsWithRatingData.forEach(item => {
          ratingsMap[item.id] = item;
        });
        
        setItemsWithRatings(ratingsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ratings:', error);
        setLoading(false);
      }
    };

    fetchItemRatings();
  }, [orderDetails, firestore]);

  const handleHover = (itemId, rating) => {
    setHoveredRatings(prev => ({
      ...prev,
      [itemId]: rating
    }));
  };

  const handleRatingSelect = (itemId, rating) => {
    setSelectedRatings(prev => ({
      ...prev,
      [itemId]: rating
    }));
  };

  const handleSubmitRating = async (itemId) => {
    const rating = selectedRatings[itemId];
    if (!rating) return;

    try {
      const itemRef = doc(firestore, 'items', itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        // Add new rating to the ratings array
        await updateDoc(itemRef, {
          ratings: arrayUnion(rating)
        });

        // Calculate and update average rating
        const currentData = itemDoc.data();
        const allRatings = [...(currentData.ratings || []), rating];
        const averageRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;

        await updateDoc(itemRef, {
          averageRating: parseFloat(averageRating.toFixed(1))
        });

        // Update local state
        setItemsWithRatings(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            averageRating,
            totalRatings: allRatings.length,
            ratings: allRatings
          }
        }));

        toast({
          title: 'Rating submitted',
          description: 'Thank you for your feedback!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Clear selected rating
        setSelectedRatings(prev => ({
          ...prev,
          [itemId]: undefined
        }));
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderInteractiveStars = (itemId) => {
    const rating = hoveredRatings[itemId] || selectedRatings[itemId] || 0;
    
    return (
      <HStack spacing={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Box
            key={star}
            cursor="pointer"
            onMouseEnter={() => handleHover(itemId, star)}
            onMouseLeave={() => handleHover(itemId, 0)}
            onClick={() => handleRatingSelect(itemId, star)}
          >
            <Star
              size={24}
              fill={star <= rating ? "#FFD700" : "none"}
              stroke={star <= rating ? "#FFD700" : "#CBD5E0"}
            />
          </Box>
        ))}
      </HStack>
    );
  };

  const renderCurrentRating = (rating) => {
    return (
      <HStack spacing={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? "#FFD700" : "none"}
            stroke={star <= rating ? "#FFD700" : "#CBD5E0"}
          />
        ))}
      </HStack>
    );
  };

  const getRatingTrend = (ratings = []) => {
    if (ratings.length < 2) return null;
    const recentRatings = ratings.slice(-3);
    const avgRecent = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
    const avgAll = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return avgRecent > avgAll ? 'up' : 'down';
  };

  if (loading) {
    return (
      <Box 
        bg="white" 
        p={4} 
        borderRadius="lg" 
        boxShadow="md" 
        mt={4}
      >
        <VStack spacing={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="60px" width="100%" />
          ))}
        </VStack>
      </Box>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      bg="white" 
      p={4} 
      borderRadius="lg" 
      boxShadow="md"
      mt={4}
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Rate Your Items
      </Text>
      <VStack spacing={4} align="stretch">
        {orderDetails?.items?.map((item) => {
          const itemWithRating = itemsWithRatings[item.id] || item;
          const trend = getRatingTrend(itemWithRating.ratings);
          
          return (
            <MotionBox
              key={item.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Box 
                p={4} 
                borderWidth="1px" 
                borderRadius="md" 
                borderColor="gray.200"
              >
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="semibold">{item.name}</Text>
                    <HStack spacing={2}>
                      <Badge 
                        colorScheme={itemWithRating.totalRatings ? 'blue' : 'gray'}
                        borderRadius="full"
                        px={2}
                      >
                        {itemWithRating.totalRatings || 0} reviews
                      </Badge>
                      {trend && (
                        <Tooltip 
                          label={`Rating trend is ${trend}`}
                          placement="top"
                        >
                          <Box color={trend === 'up' ? 'green.500' : 'red.500'}>
                            <TrendingUp size={16} />
                          </Box>
                        </Tooltip>
                      )}
                    </HStack>
                  </Flex>

                  <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.600">Current Rating:</Text>
                    {renderCurrentRating(itemWithRating.averageRating)}
                    <Text fontSize="sm" color="gray.600">
                      ({itemWithRating.averageRating?.toFixed(1) || 'No ratings'})
                    </Text>
                  </HStack>

                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">Your Rating:</Text>
                    <Flex justify="space-between" align="center">
                      {renderInteractiveStars(item.id)}
                      <Button
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<ThumbsUp size={16} />}
                        isDisabled={!selectedRatings[item.id]}
                        onClick={() => handleSubmitRating(item.id)}
                      >
                        Submit
                      </Button>
                    </Flex>
                  </VStack>
                </VStack>
              </Box>
            </MotionBox>
          );
        })}
      </VStack>
    </MotionBox>
  );
};

export default OrderItemFeedback;