import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { EmailIcon, WarningIcon } from '@chakra-ui/icons';

const TransactionError = () => {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('team@thefost.com');
    toast({
      title: "Email copied",
      status: "success",
      duration: 2000,
    });
  };

  return (
    <Flex
      minH="100vh"
      bg="gray.50"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="white"
        p={8}
        rounded="xl"
        shadow="2xl"
        maxW="md"
        w="full"
        borderWidth={1}
        borderColor="orange.200"
      >
        <VStack spacing={6}>
          <Box
            p={4}
            bg="orange.50"
            rounded="full"
          >
            <Icon as={WarningIcon} w={12} h={12} color="orange.500" />
          </Box>

          <VStack spacing={3}>
            <Heading size="lg" color="gray.700" textAlign="center">
              Transaction Failed
            </Heading>
            <Text color="gray.600" textAlign="center">
              We were unable to process your transaction. You will be redirected to the home page in 5 seconds.
            </Text>
          </VStack>

          <Box pt={4} w="full">
            <VStack spacing={3}>
              <Text fontSize="sm" color="gray.600">
                Need assistance? Contact our support team:
              </Text>
              <Button
                leftIcon={<EmailIcon />}
                colorScheme="orange"
                variant="outline"
                size="lg"
                w="full"
                onClick={handleCopyEmail}
              >
                team@thefost.com
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default TransactionError;