import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Tooltip,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  StarIcon, 
  CheckCircleIcon, 
  InfoIcon, 
  SpinnerIcon, 
  SettingsIcon 
} from '@chakra-ui/icons';

const UserLevelStatus = ({ orderCount = 10 }) => {
  const levels = [
    {
      name: 'Bronze',
      threshold: 0,
      icon: InfoIcon,
      baseColor: 'orange.400',
      accentColor: 'orange.100',
      perks: ['Basic Support']
    },
    {
      name: 'Silver',
      threshold: 50,
      icon: CheckCircleIcon,
      baseColor: 'gray.400',
      accentColor: 'gray.100',
      perks: ['Priority Support', '5% Discount']
    },
    {
      name: 'Gold',
      threshold: 100,
      icon: StarIcon,
      baseColor: 'yellow.400',
      accentColor: 'yellow.100',
      perks: ['24/7 Support', '10% Discount', 'Free Delivery']
    },
    {
      name: 'Platinum',
      threshold: 500,
      icon: SpinnerIcon,
      baseColor: 'cyan.400',
      accentColor: 'cyan.100',
      perks: ['VIP Support', '15% Discount', 'Free Delivery', 'Early Access']
    },
    {
      name: 'Diamond',
      threshold: 1000,
      icon: SettingsIcon,
      baseColor: 'purple.400',
      accentColor: 'purple.100',
      perks: ['Concierge Service', '20% Discount', 'Free Premium Delivery', 'Exclusive Events']
    }
  ];

  const currentLevel = levels.reduce((prev, curr) => {
    if (orderCount >= curr.threshold) return curr;
    return prev;
  }, levels[0]);

  const nextLevelIndex = levels.findIndex(level => level.name === currentLevel.name) + 1;
  const nextLevel = levels[nextLevelIndex] || currentLevel;

  const ordersToNextLevel = nextLevel.threshold - currentLevel.threshold;
  const progressToNextLevel = ordersToNextLevel > 0
    ? ((orderCount - currentLevel.threshold) / ordersToNextLevel) * 100
    : 100;

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const badgeBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box position="relative">
      <Box 
        position="absolute"
        inset="0"
        transform="translate(5px, 5px)"
        bg="black"
        borderRadius="xl"
      />
      <Box
        position="relative"
        bg={bgColor}
        borderRadius="xl"
        p={6}
        borderWidth="2px"
        borderColor="black"
        maxW="2xl"
        w="full"
        _hover={{ transform: 'translate(-2px, -2px)' }}
        transition="all 0.2s"
        bgGradient={useColorModeValue(
          'linear(to-br, white, gray.50)',
          'linear(to-br, gray.800, gray.900)'
        )}
      >
        <VStack spacing={6} align="stretch">
          {/* Header Section */}
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Box
                p={2}
                borderRadius="lg"
                bg={currentLevel.accentColor}
                color={currentLevel.baseColor}
              >
                <Icon as={currentLevel.icon} boxSize={6} />
              </Box>
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="sm" color={textColor}>
                  Fost Membership
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {currentLevel.name}
                </Text>
              </VStack>
            </HStack>
            <Badge
              px={3}
              py={1}
              borderRadius="full"
              colorScheme="gray"
              variant="solid"
            >
              {orderCount} Orders
            </Badge>
          </HStack>

          {/* Progress Section */}
          {nextLevel !== currentLevel && (
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color={textColor}>
                  Progress to {nextLevel.name}
                </Text>
                <Tooltip
                  label={`${nextLevel.threshold - orderCount} orders until ${nextLevel.name}`}
                  placement="top"
                  hasArrow
                >
                  <Text fontSize="sm" color="green.500" fontWeight="semibold">
                    {Math.round(progressToNextLevel)}%
                  </Text>
                </Tooltip>
              </HStack>
              <Progress
                value={progressToNextLevel}
                size="sm"
                colorScheme="green"
                borderRadius="full"
                hasStripe
                isAnimated
              />
            </Box>
          )}

          {/* Benefits Section */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={3} color={textColor}>
              Your Benefits
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {currentLevel.perks.map((perk, index) => (
                <Badge
                  key={index}
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={badgeBg}
                  color={textColor}
                  fontSize="sm"
                >
                  {perk}
                </Badge>
              ))}
            </HStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default UserLevelStatus;