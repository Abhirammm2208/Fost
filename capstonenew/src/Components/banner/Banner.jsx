import React, { useEffect, useState } from 'react';
import { Box, Circle, HStack, IconButton, Image, Text, VStack, useBreakpointValue } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import burger from '../../Assets/Untitled design (2).png';
import fost from '../../Assets/Fos t.jpg';

const BannerCarousel = ({ images = [{ id: 1, imageUrl: burger }, { id: 2, imageUrl: fost }] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const height = useBreakpointValue({ base: '260px', sm: '340px', md: '460px' });

  useEffect(() => {
    if (!isAutoPlaying || images.length < 2) return undefined;
    const interval = setInterval(() => setCurrentSlide((slide) => (slide + 1) % images.length), 5000);
    return () => clearInterval(interval);
  }, [images.length, isAutoPlaying]);

  const move = (direction) => {
    setCurrentSlide((slide) => (slide + direction + images.length) % images.length);
    setIsAutoPlaying(false);
  };

  return (
    <Box position="relative" h={height} overflow="hidden" borderRadius="20px" bg="ink">
      {images.map((image, index) => <Box key={image.id} position="absolute" inset={0} opacity={index === currentSlide ? 1 : 0} transition="opacity .6s ease"><Image src={image.imageUrl} alt={`FOST highlight ${index + 1}`} w="full" h="full" objectFit="cover" /><Box position="absolute" inset={0} bgGradient="linear(to-t, rgba(8,20,14,.76), transparent 62%)" /></Box>)}
      <VStack position="absolute" left={{ base: 5, md: 8 }} bottom={{ base: 9, md: 12 }} align="start" spacing={2} color="white"><HStack fontSize="xs" fontWeight="700" letterSpacing=".12em" color="sun"><Sparkles size={14} /> FOST PICKS</HStack><Text fontFamily="heading" fontSize={{ base: '2xl', md: '4xl' }} lineHeight="1">Made for the<br />hungry moments.</Text><Text fontSize="sm" color="whiteAlpha.800">Order ahead from local favourites.</Text></VStack>
      <HStack position="absolute" top={4} right={4} spacing={2}><IconButton aria-label="Previous highlight" icon={<ChevronLeft size={18} />} onClick={() => move(-1)} size="sm" borderRadius="full" bg="whiteAlpha.800" _hover={{ bg: 'white' }} /><IconButton aria-label="Next highlight" icon={<ChevronRight size={18} />} onClick={() => move(1)} size="sm" borderRadius="full" bg="whiteAlpha.800" _hover={{ bg: 'white' }} /></HStack>
      <HStack position="absolute" bottom={4} right={5} spacing={1.5}>{images.map((image, index) => <Circle key={image.id} size={index === currentSlide ? '8px' : '6px'} bg={index === currentSlide ? 'sun' : 'whiteAlpha.600'} cursor="pointer" onClick={() => { setCurrentSlide(index); setIsAutoPlaying(false); }} />)}</HStack>
    </Box>
  );
};

export default BannerCarousel;
