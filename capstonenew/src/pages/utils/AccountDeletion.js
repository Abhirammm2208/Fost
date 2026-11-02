import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Text,
  Textarea,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { auth, firestore } from '../../Components/firebase/Firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

const AccountDeletionPage = () => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Store deletion request in Firestore
      const deletionRequestRef = doc(firestore, 'deletionRequests', currentUser.uid);
      await setDoc(deletionRequestRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        reason: reason,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });

      // Optional: Delete user's data
      // await deleteDoc(doc(firestore, 'users', currentUser.uid));

      // Delete the user's authentication
      await deleteUser(currentUser);

      toast({
        title: 'Account deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Redirect to homepage
      window.location.href = '/';
      
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({
        title: 'Error deleting account',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container centerContent minH="100vh" py={12}>
        <Text color="gray.600">Please log in to delete your account.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>Delete Account</Heading>
          <Text color="gray.600">We're sorry to see you go</Text>
        </Box>

        <Box bg="white" shadow="base" borderRadius="lg" p={8}>
          <Alert status="warning" mb={6} borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleDeleteAccount}>
            <VStack spacing={6}>
              <FormControl>
                <FormLabel>Please tell us why you're leaving (optional)</FormLabel>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Your feedback helps us improve our services"
                  size="md"
                  focusBorderColor="orange.500"
                />
              </FormControl>

              <Checkbox
                isChecked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                colorScheme="orange"
              >
                I understand that this action cannot be undone
              </Checkbox>

              <Button
                type="submit"
                colorScheme="orange"
                size="lg"
                width="full"
                isLoading={loading}
                isDisabled={!confirmed}
              >
                Delete My Account
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default AccountDeletionPage;