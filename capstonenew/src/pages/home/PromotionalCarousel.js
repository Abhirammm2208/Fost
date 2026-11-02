import React from 'react';
import { Box, Image, Flex } from '@chakra-ui/react';
import Slider from 'react-slick';

// Import images
import pic1 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.05 PM.jpeg";
import pic2 from "../../Assets/WhatsApp Image 2024-11-20 at 10.00.18 PM.jpeg";
import pic3 from "../../Assets/WhatsApp Image 2024-11-20 at 9.59.19 PM.jpeg";

// Slider settings
const CAROUSEL_SETTINGS = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  cssEase: "linear",
  arrows: false,
  pauseOnHover: true,
};

const Carousel = () => {
  return (
    <Flex justify="center" align="center">
      <Box
        w={{ base: "90%", md: "60%", lg: "40%" }}
        h={{ base: "200px", md: "300px" }}
        maxW="600px"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="2xl"
        bg="white"
      >
        <Slider {...CAROUSEL_SETTINGS}>
          {[pic1, pic2, pic3].map((pic, index) => (
            <Box key={index} position="relative" pb="56.25%">
              <Image
                src={pic}
                alt={`Slide ${index + 1}`}
                position="absolute"
                top={0}
                left={0}
                w="full"
                h="full"
                objectFit="cover"
              />
            </Box>
          ))}
        </Slider>
      </Box>
    </Flex>
  );
};

export default Carousel;
