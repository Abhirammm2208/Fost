import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useTheme } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

const SwipeButton = ({ 
  onConfirm, 
  isDisabled = false,
  text = "Slide to confirm",
  confirmThreshold = 0.9,
  size = "md",
  colorScheme = "red",
  variant = "solid"
}) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dimensions, setDimensions] = useState({ container: 0, button: 0 });

  // Size variants
  const sizeMap = {
    sm: { height: "32px", fontSize: "sm", iconSize: 4 },
    md: { height: "40px", fontSize: "md", iconSize: 5 },
    lg: { height: "48px", fontSize: "lg", iconSize: 6 }
  };

  const { height, fontSize, iconSize } = sizeMap[size] || sizeMap.md;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && buttonRef.current) {
        setDimensions({
          container: containerRef.current.offsetWidth,
          button: buttonRef.current.offsetWidth
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleDragStart = (clientX) => {
    if (isDisabled) return;
    setIsDragging(true);
    setStartX(clientX - currentX);
  };

  const handleDrag = (clientX) => {
    if (!isDragging || isDisabled) return;
    
    const maxX = dimensions.container - dimensions.button;
    const newX = Math.max(0, Math.min(clientX - startX, maxX));
    setCurrentX(newX);

    const progress = newX / maxX;
    if (progress >= confirmThreshold) {
      setIsDragging(false);
      setCurrentX(0);
      onConfirm();
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || isDisabled) return;
    setIsDragging(false);
    setCurrentX(0);
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e) => handleDrag(e.clientX);
  const handleMouseUp = () => handleDragEnd();

  // Touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => handleDrag(e.touches[0].clientX);
  const handleTouchEnd = () => handleDragEnd();

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  return (
    <Box
      ref={containerRef}
      position="relative"
      height={height}
      bg={`${colorScheme}.50`}
      borderRadius="full"
      overflow="hidden"
      cursor={isDisabled ? "not-allowed" : "pointer"}
      opacity={isDisabled ? 0.6 : 1}
      touchAction="none"
    >
      {/* Progress track */}
      <Box
        position="absolute"
        h="100%"
        w={`${(currentX / (dimensions.container - dimensions.button)) * 100}%`}
        bg={`${colorScheme}.100`}
        transition={isDragging ? "none" : "width 0.3s"}
      />

      {/* Background text */}
      <Text
        position="absolute"
        w="100%"
        h="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color={`${colorScheme}.600`}
        fontSize={fontSize}
        fontWeight="medium"
        userSelect="none"
        pointerEvents="none"
      >
        {text} 
      </Text>

      {/* Drag button */}
      <Box
        ref={buttonRef}
        position="absolute"
        w={height}
        h={height}
        bg={variant === "solid" ? `${colorScheme}.500` : "white"}
        border="2px"
        borderColor={`${colorScheme}.500`}
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transform={`translateX(${currentX}px)`}
        transition={isDragging ? "none" : "transform 0.2s"}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        _hover={{
          bg: variant === "solid" ? `${colorScheme}.600` : `${colorScheme}.50`
        }}
        _active={{
          bg: variant === "solid" ? `${colorScheme}.700` : `${colorScheme}.100`
        }}
      >
        <ChevronRightIcon 
          boxSize={iconSize} 
          color={variant === "solid" ? "white" : `${colorScheme}.500`}
        />
      </Box>
    </Box>
  );
};

export default SwipeButton;