import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { RequireStaff } from './auth/RequireStaff';
import { Layout } from './components/Layout';
import { StoreLayout } from './components/StoreLayout';
import { CartPage } from './pages/CartPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
// Not lazy: a page that's still loading has no can on screen for the view transition to morph into.
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';

const CheckoutLayout = lazy(() =>
  import('./pages/checkout/CheckoutLayout').then((module) => ({ default: module.CheckoutLayout })),
);
const CheckoutDetailsPage = lazy(() =>
  import('./pages/checkout/CheckoutDetailsPage').then((module) => ({
    default: module.CheckoutDetailsPage,
  })),
);
const PaymentPage = lazy(() =>
  import('./pages/checkout/PaymentPage').then((module) => ({ default: module.PaymentPage })),
);
const ConfirmationPage = lazy(() =>
  import('./pages/checkout/ConfirmationPage').then((module) => ({
    default: module.ConfirmationPage,
  })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })),
);
const DashboardPage = lazy(() =>
  import('./pages/admin/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const SuppliersPage = lazy(() =>
  import('./pages/admin/SuppliersPage').then((module) => ({ default: module.SuppliersPage })),
);
const SupplierDetailPage = lazy(() =>
  import('./pages/admin/SupplierDetailPage').then((module) => ({
    default: module.SupplierDetailPage,
  })),
);
const SupplierOnboardingPage = lazy(() =>
  import('./pages/admin/SupplierOnboardingPage').then((module) => ({
    default: module.SupplierOnboardingPage,
  })),
);

export const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        {
          element: <StoreLayout />,
          children: [
            { path: 'products', element: <ProductsPage /> },
            { path: 'products/:id', element: <ProductDetailPage /> },
            { path: 'cart', element: <CartPage /> },
            {
              path: 'checkout',
              element: <CheckoutLayout />,
              children: [
                { index: true, element: <CheckoutDetailsPage /> },
                { path: 'payment', element: <PaymentPage /> },
                { path: 'confirmation', element: <ConfirmationPage /> },
              ],
            },
          ],
        },
        { path: 'login', element: <LoginPage /> },
        {
          path: 'admin',
          element: <RequireStaff />,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { index: true, element: <DashboardPage /> },
                { path: 'suppliers', element: <SuppliersPage /> },
                { path: 'suppliers/new', element: <SupplierOnboardingPage /> },
                { path: 'suppliers/:id', element: <SupplierDetailPage /> },
                { path: 'suppliers/:id/onboarding', element: <SupplierOnboardingPage /> },
              ],
            },
          ],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') },
);
