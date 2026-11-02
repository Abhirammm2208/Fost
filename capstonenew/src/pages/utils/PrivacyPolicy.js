import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Divider
} from '@chakra-ui/react';

const PrivacyPolicy = () => {
  return (
    <Box bg="white" minHeight="100vh" py={12}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading 
            as="h1" 
            size="2xl" 
            textAlign="center" 
            color="orange.500"
          >
            Privacy Policy
          </Heading>

          <Section title="1. Information Collection">
            <Text>
              FOST collects:
              - Personal identification information
              - Order history
              - Device and location data
              - Payment transaction details
            </Text>
          </Section>

          <Section title="2. Data Usage">
            <Text>
              We use collected data to:
              - Process and manage food orders
              - Improve user experience
              - Provide personalized recommendations
              - Ensure platform security
            </Text>
          </Section>

          <Section title="3. Data Sharing">
            <Text>
              We may share data with:
              - Food stalls for order fulfillment
              - Payment processors
              - Legal authorities when required
            </Text>
          </Section>

          <Section title="4. User Data Rights">
            <Text>
              Users have the right to:
              - Access their personal data
              - Request data deletion
              - Opt-out of marketing communications
              - Update personal information
            </Text>
          </Section>

          <Section title="5. Data Security">
            <Text>
              We implement:
              - Encryption for sensitive data
              - Secure payment gateways
              - Regular security audits
              - Access controls
            </Text>
          </Section>

          <Section title="6. Cookies and Tracking">
            <Text>
              - We use cookies to enhance user experience
              - Users can manage cookie preferences
              - Anonymous usage data collected for improvements
            </Text>
          </Section>

          <Section title="7. Third-Party Services">
            <Text>
              - External services may have different privacy policies
              - Users advised to review individual policies
              - FOST not responsible for third-party practices
            </Text>
          </Section>

          <Text 
            textAlign="center" 
            color="gray.500" 
            fontSize="sm" 
            mt={8}
          >
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
    >
      {title}
    </Heading>
    {children}
    <Divider my={4} borderColor="orange.200" />
  </Box>
);

export default PrivacyPolicy;