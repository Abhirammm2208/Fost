// Layout.jsx
import React from 'react';
import { Box } from '@chakra-ui/react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <Box>
      <Navbar />
      <Box as="main" pt="64px"> {/* 64px = navbar height (h-16) */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;