import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  chakra,
  Portal
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

const MotionBox = chakra(motion.div);

const TutorialOverlay = ({ 
  isOpen, 
  onClose, 
  targetRef, 
  text = "Click here to start!", 
  arrowDirection = "right" 
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top, left;
      switch(arrowDirection) {
        case "right":
          top = rect.top + scrollTop + rect.height / 2 - 50;
          left = rect.right + scrollLeft + 20;
          break;
        case "left":
          top = rect.top + scrollTop + rect.height / 2 - 50;
          left = rect.left + scrollLeft - 220;
          break;
        case "top":
          top = rect.top + scrollTop - 120;
          left = rect.left + scrollLeft + rect.width / 2 - 100;
          break;
        case "bottom":
          top = rect.bottom + scrollTop + 20;
          left = rect.left + scrollLeft + rect.width / 2 - 100;
          break;
        default:
          top = rect.top + scrollTop;
          left = rect.left + scrollLeft;
      }

      setPosition({ top, left });
    }
  }, [isOpen, targetRef, arrowDirection]);

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0,0,0,0.7)"
        zIndex={1000}
        onClick={onClose}
      />

      {/* Tutorial Box */}
      <MotionBox
        position="absolute"
        bg="white"
        p={4}
        borderRadius="lg"
        boxShadow="2xl"
        zIndex={1001}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        <Flex align="center" gap={3}>
          {/* Arrow */}
          {arrowDirection === "right" && (
            <Icon 
              as={FaArrowRight} 
              color="green.500" 
              boxSize={8} 
              animation="pulse 1s infinite"
            />
          )}
          
          {/* Text */}
          <Text fontWeight="bold" color="gray.800">
            {text}
          </Text>
          
          {/* Close Button */}
          <Button 
            size="sm" 
            colorScheme="green" 
            onClick={onClose}
            ml={3}
          >
            Got it
          </Button>
        </Flex>
      </MotionBox>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Portal>
  );
};

export default TutorialOverlay;