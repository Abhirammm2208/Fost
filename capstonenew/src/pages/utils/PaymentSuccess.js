import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Spinner, 
  VStack, 
  Text 
} from '@chakra-ui/react';
import { 
  getFirestore, 
  doc, 
  updateDoc,
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs 
} from 'firebase/firestore';

const PaymentSuccess = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const firestore = getFirestore();

  useEffect(() => {
    const processPayment = async () => {
      try {
        const paymentDetails = {
          txnid: new URLSearchParams(window.location.search).get('txnid'),
          status: new URLSearchParams(window.location.search).get('status'),
        };

        const user = JSON.parse(localStorage.getItem('user'));
        const ordersRef = collection(firestore, 'orders');
        const q = query(
          ordersRef, 
          where('shopId', '==', shopId),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          
          await updateDoc(doc(firestore, 'orders', orderDoc.id), {
            paymentStatus: 'completed',
            paymentDetails: paymentDetails
          });

          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const updatedCart = cart.filter(item => item.shopId !== shopId);
          localStorage.setItem('cart', JSON.stringify(updatedCart));

          navigate(`/order-waiting/${orderDoc.id}`);
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        navigate('/payment-error');
      }
    };

    processPayment();
  }, [shopId, navigate, firestore]);

  return (
    <Container centerContent>
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Processing your payment...</Text>
      </VStack>
    </Container>
  );
};

export default PaymentSuccess;