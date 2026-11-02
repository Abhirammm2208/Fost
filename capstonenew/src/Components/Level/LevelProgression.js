import React from 'react';
import {
  Box,
  VStack,
  Text,
  Grid,
  Flex,
  Badge,
  Image,
  Button,
  useColorModeValue,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

const LevelProgression = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLevel, setSelectedLevel] = React.useState(null);

  const levels = [
    {
      title: 'NOVICE',
      threshold: 0,
      requirements: 'Complete your first lesson',
      perks: ['Basic profile customization', 'Daily quest access'],
      description: 'Start your learning journey!'
    },
    {
      title: 'EXPLORER',
      threshold: 25,
      requirements: 'Reach 25 points',
      perks: ['Custom avatar badge', 'Weekly challenges'],
      description: 'You\'re getting better every day'
    },
    {
      title: 'ACHIEVER',
      threshold: 50,
      requirements: 'Reach 50 points',
      perks: ['Special profile effects', 'Achievement showcase'],
      description: 'Your progress is remarkable'
    },
    {
      title: 'MASTER',
      threshold: 75,
      requirements: 'Reach 75 points',
      perks: ['Exclusive content access', 'Create study groups'],
      description: 'You\'re among the top learners'
    },
    {
      title: 'LEGEND',
      threshold: 100,
      requirements: 'Reach 100 points',
      perks: ['Mentor privileges', 'Custom learning path'],
      description: 'You\'ve reached the pinnacle'
    }
  ];

  const handleImageUpload = (levelTitle) => {
    console.log(`Upload image for ${levelTitle}`);
  };

  return (
    <Box p={8} maxW="1200px" mx="auto" bg="white">
      <Text
        fontSize="3xl"
        fontWeight="bold"
        color="gray.800"
        mb={8}
        textAlign="center"
      >
        Level Progression
      </Text>

      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        gap={6}
      >
        {levels.map((level) => (
          <Box
            key={level.title}
            p={6}
            borderRadius="xl"
            bg="white"
            boxShadow="lg"
            border="1px"
            borderColor="orange.200"
            position="relative"
            transition="transform 0.2s"
            _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
          >
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Badge
                  bg="orange.400"
                  color="white"
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  {level.title}
                </Badge>
                <Text color="orange.500" fontWeight="bold">
                  {level.threshold} pts
                </Text>
              </Flex>

              <Box
                position="relative"
                h="120px"
                w="120px"
                mx="auto"
                borderRadius="md"
                overflow="hidden"
                bg="gray.100"
                border="2px"
                borderColor="orange.200"
              >
                <Image
                  src="/api/placeholder/120/120"
                  alt={`${level.title} avatar`}
                  objectFit="cover"
                  w="full"
                  h="full"
                />
                <IconButton
                  aria-label="Upload image"
                  icon={<AddIcon />}
                  position="absolute"
                  bottom={2}
                  right={2}
                  size="sm"
                  colorScheme="orange"
                  variant="solid"
                  onClick={() => handleImageUpload(level.title)}
                />
              </Box>

              <Text color="gray.600" fontSize="sm" noOfLines={2}>
                {level.description}
              </Text>

              <Button
                size="sm"
                colorScheme="orange"
                variant="outline"
                onClick={() => {
                  setSelectedLevel(level);
                  onOpen();
                }}
              >
                View Rewards
              </Button>
            </VStack>
          </Box>
        ))}
      </Grid>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="white">
          <ModalHeader color="orange.500">
            {selectedLevel?.title} Rewards
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text color="gray.700" fontWeight="bold" mb={2}>
                  How to unlock:
                </Text>
                <Text color="gray.600">{selectedLevel?.requirements}</Text>
              </Box>
              <Box>
                <Text color="gray.700" fontWeight="bold" mb={2}>
                  Level Rewards:
                </Text>
                {selectedLevel?.perks.map((perk, index) => (
                  <Text key={index} color="gray.600">
                    • {perk}
                  </Text>
                ))}
              </Box>
              <Box>
                <Text color="gray.700" fontWeight="bold" mb={2}>
                  About this level:
                </Text>
                <Text color="gray.600">{selectedLevel?.description}</Text>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LevelProgression;