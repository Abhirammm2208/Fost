import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Divider,
  Icon
} from '@chakra-ui/react';
import { 
  WarningIcon, 
  InfoIcon, 
  LockIcon, 
  CloseIcon, 
  TimeIcon 
} from '@chakra-ui/icons';

const CancellationPolicy = () => {
  return (
    <Box bg="white" minHeight="100vh" py={12}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading 
            as="h1" 
            size="2xl" 
            textAlign="center" 
            color="orange.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <WarningIcon mr={4} />
            Cancellation & Refund Policy
          </Heading>

          <Section title="1. Order Cancellation">
            <Text>
              FOST's cancellation policy is designed to ensure fair practices for both customers and food stalls:
              - Orders can be cancelled before preparation begins
              - No cancellations once food preparation starts
              - Unique QR code tracking for order status
            </Text>
          </Section>

          <Section title="2. Refund Conditions">
            <Text>
              Refunds are processed under specific circumstances:
              - Full refund if order is cancelled before preparation
              - Partial refund for verified stall errors
              - No refunds for user-initiated cancellations after preparation
              - Payment processed through secure PayU gateway
            </Text>
          </Section>

          <Section title="3. Order Pickup Timeline">
            <Text>
              Critical pickup conditions:
              - Maximum waiting time: 45 minutes from order preparation
              - Order considered abandoned if not picked up within 45 minutes
              - No refund for uncollected orders
              - Stall reserves right to resell or dispose of unclaimed orders
            </Text>
          </Section>

          <Section title="4. Payment Processing">
            <Text>
              Payment and transaction details:
              - Integrated with secure PayU payment gateway
              - Instant transaction verification
              - Multiple payment methods supported
              - Transparent fee structure
            </Text>
          </Section>

          <Section title="5. Technical Failures">
            <Text>
              Handling of technical interruptions:
              - Compensation for verified system errors
              - 24-hour customer support for transaction issues
              - Comprehensive transaction logs
              - Prompt resolution of payment discrepancies
            </Text>
          </Section>

          <Section title="6. User Responsibilities">
            <Text>
              Customer obligations:
              - Provide accurate contact and pickup information
              - Collect order within designated time frame
              - Verify order details at pickup
              - Maintain QR code integrity
            </Text>
          </Section>

          <Section title="7. Dispute Resolution">
            <Text>
              Conflict management process:
              - Dedicated customer support team
              - Transparent escalation mechanism
              - Mediation for unresolved disputes
              - Fair and timely resolution approach
            </Text>
          </Section>

          <Box 
            bg="orange.50" 
            p={4} 
            borderRadius="md" 
            textAlign="center"
          >
            <Icon as={InfoIcon} color="orange.500" mr={2} />
            <Text as="span" color="orange.700">
              All policies subject to change. Users will be notified of significant updates.
            </Text>
          </Box>

          <Text 
            textAlign="center" 
            color="gray.500" 
            fontSize="sm" 
            mt={8}
          >
            <TimeIcon mr={2} />
            Last Updated: November 2024
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

const Section = ({ title, children }) => (
  <Box>
    <Heading 
      as="h2" 
      size="lg" 
      color="orange.600" 
      mb={4}
      display="flex"
      alignItems="center"
    >
      <CloseIcon mr={3} color="orange.400" />
      {title}
    </Heading>
    {children}
    <Divider my={4} borderColor="orange.200" />
  </Box>
);

export default CancellationPolicy;