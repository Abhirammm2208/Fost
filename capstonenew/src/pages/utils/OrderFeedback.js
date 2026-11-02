import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Textarea,
  Image,
  Box,
  useToast,
  Icon
} from '@chakra-ui/react';
import { Star } from 'lucide-react';
import { getFirestore, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const OrderFeedback = ({ isOpen, onClose, items, orderId }) => {
  const [ratings, setRatings] = useState(
    items.reduce((acc, item) => ({
      ...acc,
      [item.id]: { stars: 0, comment: '' }
    }), {})
  );
  const [hoveredStars, setHoveredStars] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const db = getFirestore();

  const handleStarHover = (itemId, starCount) => {
    setHoveredStars(prev => ({
      ...prev,
      [itemId]: starCount
    }));
  };

  const handleStarClick = (itemId, starCount) => {
    setRatings(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], stars: starCount }
    }));
  };

  const handleCommentChange = (itemId, comment) => {
    setRatings(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment }
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      
      // Update each item's ratings in Firebase
      for (const item of items) {
        const itemRating = ratings[item.id];
        if (itemRating.stars > 0) {
          const itemRef = doc(db, 'items', item.id);
          
          // Get current ratings
          const itemDoc = await getDoc(itemRef);
          const currentData = itemDoc.data() || {};
          const currentRatings = currentData.ratings || [];
          
          // Add new rating
          const newRating = {
            stars: itemRating.stars,
            comment: itemRating.comment,
            orderId: orderId,
            timestamp: serverTimestamp()
          };
          
          // Calculate new average
          const updatedRatings = [...currentRatings, newRating];
          const averageRating = updatedRatings.reduce((sum, r) => sum + r.stars, 0) / updatedRatings.length;
          
          // Update document
          batch.update(itemRef, {
            ratings: updatedRatings,
            averageRating: averageRating
          });
        }
      }
      
      await batch.commit();
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rate Your Purchase</ModalHeader>
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {items.map((item) => (
              <Box
                key={item.id}
                borderWidth="1px"
                borderRadius="lg"
                p={4}
              >
                <HStack spacing={4}>
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    boxSize="64px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                  <VStack align="start" flex={1}>
                    <Text fontWeight="semibold">{item.name}</Text>
                    <HStack spacing={1}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                          key={star}
                          as={Star}
                          boxSize={6}
                          cursor="pointer"
                          color={
                            star <= (hoveredStars[item.id] || ratings[item.id].stars)
                              ? 'yellow.400'
                              : 'gray.300'
                          }
                          fill={
                            star <= (hoveredStars[item.id] || ratings[item.id].stars)
                              ? 'yellow.400'
                              : 'none'
                          }
                          onMouseEnter={() => handleStarHover(item.id, star)}
                          onMouseLeave={() => handleStarHover(item.id, 0)}
                          onClick={() => handleStarClick(item.id, star)}
                        />
                      ))}
                    </HStack>
                    <Textarea
                      placeholder="Share your thoughts about this item..."
                      value={ratings[item.id].comment}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      size="sm"
                    />
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={submitting}
          >
            Submit Feedback
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OrderFeedback;