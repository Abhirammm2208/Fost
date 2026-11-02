export const PaymentSuccess = () => {
    const navigate = useNavigate();
    const toast = useToast();
  
    useEffect(() => {
      const verifyPayment = async () => {
        try {
          const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder'));
          
          if (pendingOrder) {
            const response = await axios.post('http://localhost:5000/payment-response', {
              txnid: pendingOrder.paymentDetails.txnid
            });
  
            if (response.data.status === 'success') {
              // Create Firestore order and redirect
              toast({
                title: 'Payment Successful',
                description: 'Your payment has been processed.',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            } else {
              toast({
                title: 'Payment Verification Failed',
                description: 'Unable to verify your payment. Please contact support.',
                status: 'error',
                duration: 3000,
                isClosable: true,
              });
            }
          }
        } catch (error) {
          console.error('Payment verification error:', error);
        }
      };
  
      verifyPayment();
    }, []);
  
    return (
      <Container centerContent>
        <VStack spacing={6}>
          <Heading>Payment Processing</Heading>
          <Text>Please wait while we verify your payment...</Text>
        </VStack>
      </Container>
    );
  };