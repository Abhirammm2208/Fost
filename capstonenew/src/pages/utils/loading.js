import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Image,
  keyframes,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import sai from '../../Assets/Fos_t-removebg-preview.png';

const LoadingScreen = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Animation keyframes
  const slideUpKeyframes = keyframes`
    0% { 
      transform: translateY(30px) scale(0.95);
      opacity: 0;
      filter: blur(5px);
    }
    50% {
      filter: blur(2px);
    }
    100% { 
      transform: translateY(0) scale(1);
      opacity: 1;
      filter: blur(0);
    }
  `;

  const floatKeyframes = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  `;

  const animations = {
    slideUp: prefersReducedMotion
      ? undefined
      : `${slideUpKeyframes} 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
    float: prefersReducedMotion
      ? undefined
      : `${floatKeyframes} 3s ease-in-out infinite`,
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return children;

  return (
    <Flex
      position="fixed"
      inset="0"
      bg="linear-gradient(135deg, #FC8019 0%, #fd9642 100%)"
      alignItems="center"
      justifyContent="center"
      zIndex="9999"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        inset="0"
        opacity="0.1"
        backgroundImage={`
          radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px),
          radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)
        `}
        backgroundSize="30px 30px, 90px 90px"
        backgroundPosition="0 0, 15px 15px"
        pointerEvents="none"
      />

      {/* Logo Container */}
      <Box
        animation={animations.slideUp}
        opacity="0"
        position="relative"
      >
        <Box animation={animations.float}>
          <Image
            src={sai}
            alt="Logo"
            width="400px"
            height="auto"
            objectFit="contain"
            filter="drop-shadow(0 4px 12px rgba(252, 128, 25, 0.3))"
          />
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        width="full"
        height="4px"
        bg="gray.100"
        overflow="hidden"
      >
        <Box
          height="full"
          bgGradient="linear(to-r,rgb(86, 155, 17),rgb(97, 253, 66))"
          width="0"
          animation="progressBar 2.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
          sx={{
            "@keyframes progressBar": {
              "0%": { width: "0%", opacity: 0.7 },
              "50%": { opacity: 1 },
              "100%": { width: "100%", opacity: 0.9 }
            }
          }}
          boxShadow="0 0 10px rgba(252, 128, 25, 0.3)"
        />
      </Box>
    </Flex>
  );
};

export default LoadingScreen;