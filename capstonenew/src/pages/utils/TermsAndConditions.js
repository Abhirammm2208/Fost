import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Divider,
  UnorderedList,
  ListItem,
  Link,
  Flex,
  Icon
} from '@chakra-ui/react';
import { 
  InfoOutlineIcon, 
  WarningIcon, 
  CheckCircleIcon, 
  LockIcon 
} from '@chakra-ui/icons';

const TermsAndConditions = () => {
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
            gap={4}
          >
            <Icon as={CheckCircleIcon} color="orange.600" boxSize={10} />
            FOST Platform Terms and Conditions
            <Icon as={LockIcon} color="orange.600" boxSize={10} />
          </Heading>

          <Section 
            title="1. User Agreement" 
            icon={InfoOutlineIcon}
            color="blue.500"
          >
            <Text mb={4}>
              Welcome to FOST, a digital platform connecting food enthusiasts with local food stalls. By accessing or using our service, you enter into a binding agreement with our platform.
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                This agreement constitutes a legal contract between you and FOST.
              </ListItem>
              <ListItem>
                Continued use of the platform implies full acceptance of these terms.
              </ListItem>
              <ListItem>
                FOST reserves the right to modify these terms at any time.
              </ListItem>
            </UnorderedList>
          </Section>

          <Section 
            title="2. User Eligibility" 
            icon={WarningIcon}
            color="red.500"
          >
            <Text mb={4}>
              Access to and use of FOST is subject to specific eligibility criteria:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                Minimum age requirement: 18 years old
              </ListItem>
              <ListItem>
                Users under 18 must have verifiable parental or guardian consent
              </ListItem>
              <ListItem>
                Valid government-issued identification may be required for verification
              </ListItem>
              <ListItem>
                One user account per individual is permitted
              </ListItem>
            </UnorderedList>
          </Section>

          <Section 
            title="3. Order Policies" 
            icon={CheckCircleIcon}
            color="green.500"
          >
            <Text mb={4}>
              Our platform facilitates seamless food ordering with clear, transparent policies:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                Orders are confirmed subject to real-time stall availability
              </ListItem>
              <ListItem>
                Displayed prices are final at the time of order placement
              </ListItem>
              <ListItem>
                Pickup window: 30 minutes from 'Ready for Pickup' status
              </ListItem>
              <ListItem>
                Free cancellations before order preparation commences
              </ListItem>
              <ListItem>
                Partial order modifications may incur additional charges
              </ListItem>
            </UnorderedList>
          </Section>

          <Section 
            title="4. Payment Terms" 
            icon={LockIcon}
            color="purple.500"
          >
            <Text mb={4}>
              Secure and transparent financial transactions are our priority:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                Multiple secure digital payment methods supported
              </ListItem>
              <ListItem>
                All prices include applicable local taxes and service charges
              </ListItem>
              <ListItem>
                Refund processing determined by individual food stall policies
              </ListItem>
              <ListItem>
                Potential hold or authorization on payment methods during order
              </ListItem>
              <ListItem>
                Fraudulent transaction attempts will result in account suspension
              </ListItem>
            </UnorderedList>
          </Section>

          <Section 
            title="5. QR Code Pickup System" 
            icon={InfoOutlineIcon}
            color="teal.500"
          >
            <Text mb={4}>
              Our innovative QR code system ensures secure and efficient order pickup:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                Unique, single-use QR codes generated for each order
              </ListItem>
              <ListItem>
                Mandatory presentation at designated stall pickup area
              </ListItem>
              <ListItem>
                QR codes expire 45 minutes after order 'Ready' status
              </ListItem>
              <ListItem>
                Lost or expired codes require re-ordering and repayment
              </ListItem>
            </UnorderedList>
          </Section>

          <Section 
            title="6. User Conduct" 
            icon={WarningIcon}
            color="red.600"
          >
            <Text mb={4}>
              Users are expected to maintain highest standards of digital etiquette:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                Strictly prohibited: Illegal activities, fraud, harassment
              </ListItem>
              <ListItem>
                Respectful communication with stall owners and other users
              </ListItem>
              <ListItem>
                Accurate and truthful account information
              </ListItem>
              <ListItem>
                No impersonation or unauthorized account access
              </ListItem>
              <ListItem>
                Violation of terms may result in immediate account termination
              </ListItem>
            </UnorderedList>
          </Section>

          <Section 
            title="7. Liability and Disclaimers" 
            icon={InfoOutlineIcon}
            color="gray.600"
          >
            <Text mb={4}>
              Important legal disclaimers to understand our operational scope:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                Not responsible for food quality, preparation, or taste
              </ListItem>
              <ListItem>
                No liability for stall-side delays or operational issues
              </ListItem>
              <ListItem>
                Technical glitches do not guarantee compensation
              </ListItem>
              <ListItem>
                Users engage with food stalls at their own discretion
              </ListItem>
            </UnorderedList>
          </Section>

          <Section 
            title="8. Privacy and Data Protection" 
            icon={LockIcon}
            color="blue.600"
          >
            <Text mb={4}>
              We are committed to protecting your personal information:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                Adherence to local and international data protection regulations
              </ListItem>
              <ListItem>
                User data collected only for platform functionality
              </ListItem>
              <ListItem>
                No sale of personal information to third parties
              </ListItem>
              <ListItem>
                Encrypted storage and transmission of sensitive data
              </ListItem>
            </UnorderedList>
          </Section>

          <Text
            textAlign="center"
            color="gray.500"
            fontSize="sm"
            mt={8}
          >
            Last Updated: November 2024 | 
            <Link 
              color="orange.500" 
              href="/contactus" 
              ml={2}
              _hover={{ textDecoration: 'underline' }}
            >
              Contact Us
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

const Section = ({ title, children, icon, color }) => (
  <Box>
    <Flex align="center" mb={4}>
      <Icon as={icon} color={color} mr={3} boxSize={6} />
      <Heading
        as="h2"
        size="lg"
        color={color}
      >
        {title}
      </Heading>
    </Flex>
    {children}
    <Divider my={4} borderColor="orange.200" />
  </Box>
);

export default TermsAndConditions;