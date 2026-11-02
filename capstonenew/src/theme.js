import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f26a3d',
      600: '#df552d',
      700: '#b84223',
      800: '#8e351f',
      900: '#5f2619',
    },
    moss: {
      50: '#effaf4',
      100: '#d8f3e4',
      200: '#b5e8cd',
      300: '#7bd4aa',
      400: '#42bc83',
      500: '#198b5d',
      600: '#14764f',
      700: '#105d40',
      800: '#0c4932',
      900: '#083426',
    },
    ink: '#18231d',
    canvas: '#fcfaf6',
    sun: '#ffd166',
  },
  fonts: {
    heading: '"Space Grotesk", "Avenir Next", system-ui, sans-serif',
    body: '"DM Sans", "Avenir Next", system-ui, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'canvas',
        color: 'ink',
      },
      '::selection': {
        bg: 'brand.200',
        color: 'ink',
      },
    },
  },
  radii: {
    xl: '20px',
    '2xl': '28px',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        borderRadius: '12px',
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
    Heading: {
      baseStyle: {
        letterSpacing: '-0.045em',
      },
    },
  },
});

export default theme;
