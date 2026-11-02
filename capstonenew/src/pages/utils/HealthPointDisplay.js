import React from 'react';
import {
  Box,
  VStack,
  Text,
  Progress,
  Tooltip,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Badge
} from '@chakra-ui/react';
import { StarIcon, InfoIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const HealthPointsDisplay = ({ points, maxPoints = 100 }) => {
  const navigate = useNavigate();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('orange.400', 'orange.500');
  const textColor = useColorModeValue('gray.800', 'white');
  const accentColor = useColorModeValue('orange.500', 'orange.400');
  const menuBg = useColorModeValue('white', 'gray.700');
  const menuHoverBg = useColorModeValue('gray.50', 'gray.600');
  const shadowColor = useColorModeValue('orange.500', 'orange.400');

  const levels = [
    { threshold: 0, title: 'NOVICE', color: 'gray.400' },
    { threshold: 25, title: 'SQUIRE', color: 'orange.300' },
    { threshold: 50, title: 'KNIGHT', color: 'orange.400' },
    { threshold: 75, title: 'WARRIOR', color: 'orange.500' },
    { threshold: 100, title: 'TITAN', color: 'orange.600' }
  ];

  const currentLevel = levels.reduce((prev, curr) => 
    points >= curr.threshold ? curr : prev
  );

  const nextLevelIndex = levels.findIndex(level => level.title === currentLevel.title) + 1;
  const nextLevel = levels[nextLevelIndex];

  const healthPercentage = (points / maxPoints) * 100;

  return (
    <Box position="relative">
      <Box 
        position="absolute"
        inset="0"
        transform="translate(5px, 5px)"
        bg={shadowColor}
        borderRadius="xl"
      />
      <Box
        position="relative"
        p={6}
        borderRadius="xl"
        bg={cardBg}
        borderWidth="2px"
        borderColor={borderColor}
        _hover={{ transform: 'translate(-2px, -2px)' }}
        transition="all 0.2s"
        overflow="hidden"
      >
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Text 
                fontSize="2xl" 
                fontWeight="bold"
                color={textColor}
              >
                Health Points
              </Text>
              <Badge
                colorScheme="orange"
                variant="solid"
                fontSize="md"
                px={3}
                py={1}
              >
                {currentLevel.title}
              </Badge>
            </HStack>
            
            <Menu>
              <MenuButton>
                <Tooltip
                  label="View more information"
                  placement="top"
                  bg={menuBg}
                  color={textColor}
                >
                  <InfoIcon 
                    color={accentColor} 
                    w={6} 
                    h={6} 
                    cursor="pointer"
                  />
                </Tooltip>
              </MenuButton>
              <MenuList bg={menuBg} borderColor={borderColor}>
                <MenuItem
                  icon={<StarIcon color={accentColor} />}
                  onClick={() => navigate('/levels')}
                  _hover={{ bg: menuHoverBg }}
                >
                  View Levels
                </MenuItem>
                <MenuItem
                  icon={<StarIcon color={accentColor} />}
                  onClick={() => navigate('/leaderboard')}
                  _hover={{ bg: menuHoverBg }}
                >
                  Leaderboard
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>

          <Flex justify="space-between" align="center" gap={6}>
            <CircularProgress
              value={healthPercentage}
              size="120px"
              thickness="8px"
              color={accentColor}
              trackColor="gray.100"
            >
              <CircularProgressLabel color={textColor} fontSize="xl" fontWeight="bold">
                {points}
              </CircularProgressLabel>
            </CircularProgress>

            <Box flex="1">
              <Box position="relative">
                <Progress
                  value={healthPercentage}
                  size="lg"
                  colorScheme="orange"
                  bg="gray.100"
                  borderRadius="full"
                  height="24px"
                  sx={{
                    '& > div': {
                      transition: 'width 0.3s ease-in-out',
                    }
                  }}
                />
              </Box>
              {nextLevel && (
                <Text
                  mt={2}
                  fontSize="sm"
                  color={textColor}
                  fontWeight="medium"
                  textAlign="right"
                >
                  Next: {nextLevel.title} ({nextLevel.threshold - points} pts)
                </Text>
              )}
            </Box>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default HealthPointsDisplay;