# FOST

**FOST** is a React-based food ordering and pickup platform for customers, food-stall vendors, and administrators. It helps customers discover nearby food courts, order ahead, pay securely, and collect meals without waiting in line.

> Order less. Enjoy more.

## Contents

- [Overview](#overview)
- [Features](#features)
- [How it works](#how-it-works)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Development commands](#development-commands)
- [Application routes](#application-routes)
- [Integrations](#integrations)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

FOST brings the complete pickup journey into one web application:

- Customers can browse food courts, explore menus, build a cart, and place pickup orders.
- Vendors can manage items, monitor incoming orders, and coordinate preparation and collection.
- Administrators can manage food courts, grocery products, orders, and platform operations.

The frontend is a Create React App application styled with Chakra UI and connected to Firebase services for authentication and data storage.

## Features

### Customer experience

- Browse nearby food courts and search available stalls.
- Explore menus by category and view item details.
- Add items to a cart and manage quantities across food courts.
- Apply available coupons and review order totals.
- Complete checkout through the configured payment flow.
- Track order progress and view previous orders.
- Sign in with email/password or Google authentication.
- Use grocery browsing, loyalty levels, leaderboard, and account tools.

### Vendor workspace

- Manage menu items, availability, pricing, and inventory.
- View pending, processing, completed, and historical orders.
- Scan pickup orders and coordinate counter orders.
- Review sales and operational analytics.

### Administration

- Manage food courts and grocery catalogue data.
- Review grocery orders and platform activity.
- Provide role-based access for customers, vendors, and administrators.

## How it works

1. **Choose a food court** — Browse nearby stalls or search for a place to eat.
2. **Build an order** — Select menu items, review the cart, and apply a coupon when available.
3. **Pay securely** — Continue through the configured checkout and payment integration.
4. **Follow preparation** — Track order status while the vendor prepares the meal.
5. **Collect and enjoy** — Use the pickup information shown in the order flow to collect the meal.

The same flow is extended for vendors through dedicated dashboards for inventory, order status, pickup scanning, and analytics.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 18 and Create React App |
| UI | Chakra UI, Emotion, Lucide, Heroicons |
| Routing | React Router DOM |
| Authentication and data | Firebase Authentication, Firestore, Storage, Analytics |
| Client data | Apollo Client and React Query |
| Payments | PayU checkout flow with a small Express callback server |
| Charts and reporting | Recharts and XLSX |
| Supporting services | Express, Axios, Nodemailer, and browser polyfills |

The main application entry point is `src/App.js`. It composes the router, shared layouts, Chakra theme, Apollo provider, and React Query provider.

## Project structure

```text
.
├── public/                 # Static assets and the HTML shell
├── src/
│   ├── Components/         # Shared UI, Firebase, cart, order, and analytics components
│   ├── layouts/            # Shared application layouts
│   ├── pages/
│   │   ├── Auth/           # Login, registration, and password reset
│   │   ├── Admin/          # Administration screens
│   │   ├── cart/           # Cart and checkout pages
│   │   ├── groceriesPage/  # Grocery catalogue and order management
│   │   ├── shop/           # Food-court menu browsing
│   │   ├── user/           # Profiles, levels, and leaderboard
│   │   ├── utils/          # Shared informational and order utilities
│   │   └── vendors/        # Vendor dashboards and workflows
│   ├── App.js              # Providers and route definitions
│   ├── index.js            # React entry point
│   ├── theme.js            # Chakra UI theme
│   └── *.css               # Global and application styles
├── server.js               # Express payment callback service
├── render.yaml             # Static deployment configuration
├── package.json            # Scripts and dependencies
└── .env                    # Local-only configuration; do not commit
```

## Getting started

### Prerequisites

- Node.js 18 or a compatible current LTS release.
- npm 9 or later.
- Access to the Firebase project used by the application when authentication or Firestore data is required.

### Installation

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/Abhirammm2208/Fost.git
   cd Fost
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env` file for any environment-specific values.

4. Start the development server:

   ```bash
   npm start
   ```

The frontend is then available at [http://localhost:3000](http://localhost:3000).

## Environment configuration

The frontend reads the following optional Create React App variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `PUBLIC_URL` | Base path used by the browser router | `/` |
| `REACT_APP_GRAPHQL_URL` | Apollo GraphQL endpoint | `/graphql` |
| `REACT_APP_API_URL` | Payment API base URL | `http://localhost:5058` |
| `REACT_APP_BACKEND_URL` | Vendor/order backend base URL | `http://localhost:5337` |

Example local configuration:

```dotenv
PUBLIC_URL=
REACT_APP_GRAPHQL_URL=/graphql
REACT_APP_API_URL=http://localhost:5058
REACT_APP_BACKEND_URL=http://localhost:5337
```

Restart the development server after changing environment variables. Never commit private credentials, payment salts, service-account keys, or a machine-specific `.env` file.

## Development commands

Run these commands from the project root:

| Command | Description |
| --- | --- |
| `npm start` | Start the React development server. |
| `npm run build` | Create an optimized production build in `build/`. |
| `npm test` | Run the Create React App test runner. |
| `npm run eject` | Eject Create React App configuration; this is irreversible. |
| `node server.js` | Start the optional Express payment callback service. |

For a production-style verification, run `npm run build` and serve the generated `build/` directory with a static web server.

## Application routes

### Public routes

| Path | Purpose |
| --- | --- |
| `/` | Home and discovery page |
| `/register` | Create an account |
| `/login` | Sign in |
| `/reset-password` | Reset a password |
| `/AboutUs` | About FOST |
| `/HowItWorks` | Product walkthrough |
| `/Contactus` | Contact form |
| `/helpcenter` | Help centre |
| `/Groceriesbyfost` | Grocery catalogue |
| `/LeaderBoard` | Customer leaderboard |

### Authenticated routes

| Path | Purpose |
| --- | --- |
| `/main` | Food-court discovery |
| `/shop/:shopId` | Browse a shop menu |
| `/cart` | Review the cart |
| `/orders` | View customer orders |
| `/Profile` | Manage the customer profile |
| `/order-waiting/:orderid` | Track an order |
| `/levels` | View customer levels |

### Admin and vendor routes

Administrators use `/admin/shops`, `/admin/Groceriesbyfostdash`, and `/admin/Groceriesbyfostdashdash`. Vendor tools are grouped below `/vendor`, including item management, order queues, pickup scanning, analytics, order history, and inventory management.

## Integrations

### Firebase

`src/Components/firebase/Firebase.js` initialises Firebase Authentication, Firestore, Storage, and Analytics. User roles are read from the `users` collection and are used by `ProtectedRoute` to control customer, vendor, and administrator access.

### GraphQL and client data

Apollo Client is configured in `src/App.js` and uses `REACT_APP_GRAPHQL_URL` when supplied. React Query is also available for server-state workflows used throughout the application.

### Payments

The checkout page calls the configured payment API and the Express service in `server.js` exposes a payment-success callback route. Configure the payment backend and callback URLs for the environment where the application is deployed; do not put merchant secrets in frontend code.

### Email and notifications

The project includes Nodemailer and application-level order and account feedback flows. Provider credentials and mail settings should be supplied through a secure backend configuration.

## Deployment

The included `render.yaml` describes a static deployment:

- Build command: `npm run build`
- Publish directory: `build`
- All routes fall back to `index.html`, allowing React Router pages to load correctly on refresh.

For another hosting provider, use the same build command and publish directory. Configure the required `REACT_APP_*` variables in the provider dashboard, enable the Firebase web application for the deployed domain, and configure the payment callback endpoint to use the production URL.

### Express callback service

The optional Node service can be started independently with:

```bash
node server.js
```

It listens on the port defined by the service implementation and handles the payment-success redirect. In production, run it as a separate backend service rather than alongside the static frontend.

## Troubleshooting

### The app redirects to the home page

Routes that require authentication use `ProtectedRoute`. Sign in first and confirm that the Firebase user exists and has the expected role in the `users` collection.

### API requests use localhost

The application has localhost fallbacks for development. Set `REACT_APP_GRAPHQL_URL`, `REACT_APP_API_URL`, and `REACT_APP_BACKEND_URL` to deployed service URLs, then restart or rebuild the frontend.

### A refreshed route returns a 404

Configure the host to rewrite unknown frontend paths to `index.html`. The included Render configuration already provides this fallback.

### Build warnings appear

Run `npm run build` to distinguish warnings from compilation errors. Warnings from third-party source maps or existing unused imports do not necessarily prevent a production bundle from being generated.

## Contributing

1. Create a focused branch from `main`.
2. Keep changes aligned with the existing React, Chakra UI, and Firebase patterns.
3. Do not commit `.env` files, credentials, generated `build/` output, or `node_modules/`.
4. Run the relevant checks before opening a pull request:

   ```bash
   npm run build
   ```

5. Describe the user-facing change and any required environment or Firebase setup in the pull request.

## License

This project currently does not declare a separate open-source license. All rights remain with the project owner unless a license is added to the repository.
