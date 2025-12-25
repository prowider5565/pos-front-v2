import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/router/protected-route'

// Lazy load components for better performance
const Dashboard = lazy(() => import('@/app/dashboard/page'))
const Users = lazy(() => import('@/app/users/page'))
const Suppliers = lazy(() => import('@/app/suppliers/page'))
const Clients = lazy(() => import('@/app/clients/page'))

// Savdo (Sales) pages
const Sotuv = lazy(() => import('@/app/savdo/sotuv/page'))
const SalesList = lazy(() => import('@/app/sales/page'))
const SaleDetail = lazy(() => import('@/app/sales/id/page'))
const ProductsSuppliers = lazy(() => import('@/app/products/page'))
const ProductsBySupplier = lazy(() => import('@/app/products/supplierId/page'))
const ProductDetail = lazy(() => import('@/app/products/supplierId/productId/page'))

// Debts pages
const SupplierDebts = lazy(() => import('@/app/debts/suppliers/page'))
const SupplierOldDebtsDetail = lazy(() => import('@/app/debts/suppliers/supplierId/old-debts/page'))
const SupplierNewDebtsDetail = lazy(() => import('@/app/debts/suppliers/supplierId/new-debts/page'))
const ClientDebts = lazy(() => import('@/app/debts/clients/page'))
const ClientOldDebtsDetail = lazy(() => import('@/app/debts/clients/clientId/old-debts/page'))

// Auth pages
const SignIn = lazy(() => import('@/app/auth/sign-in/page'))
const ForgotPassword = lazy(() => import('@/app/auth/forgot-password/page'))

// Error pages
const Unauthorized = lazy(() => import('@/app/errors/unauthorized/page'))
const Forbidden = lazy(() => import('@/app/errors/forbidden/page'))
const NotFound = lazy(() => import('@/app/errors/not-found/page'))
const InternalServerError = lazy(() => import('@/app/errors/internal-server-error/page'))
const UnderMaintenance = lazy(() => import('@/app/errors/under-maintenance/page'))

// Settings pages
const UserSettings = lazy(() => import('@/app/settings/user/page'))
const AppearanceSettings = lazy(() => import('@/app/settings/appearance/page'))

export interface RouteConfig {
  path: string
  element: React.ReactNode
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  // Default route - redirect to dashboard
  {
    path: "/",
    element: <Navigate to="dashboard" replace />
  },

  // Dashboard Routes (Protected)
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },

  // Content Pages (Protected)
  {
    path: "/users",
    element: (
      <ProtectedRoute>
        <Users />
      </ProtectedRoute>
    )
  },
  {
    path: "/suppliers",
    element: (
      <ProtectedRoute>
        <Suppliers />
      </ProtectedRoute>
    )
  },
  {
    path: "/clients",
    element: (
      <ProtectedRoute>
        <Clients />
      </ProtectedRoute>
    )
  },

  // Savdo (Sales) Routes (Protected)
  {
    path: "/savdo/sotuv",
    element: (
      <ProtectedRoute>
        <Sotuv />
      </ProtectedRoute>
    )
  },
  {
    path: "/sales",
    element: (
      <ProtectedRoute>
        <SalesList />
      </ProtectedRoute>
    )
  },
  {
    path: "/sales/:id",
    element: (
      <ProtectedRoute>
        <SaleDetail />
      </ProtectedRoute>
    )
  },

  // Debts Routes (Protected)
  {
    path: "/debts/suppliers",
    element: (
      <ProtectedRoute>
        <SupplierDebts />
      </ProtectedRoute>
    )
  },
  {
    path: "/debts/suppliers/:supplierId/old-debts",
    element: (
      <ProtectedRoute>
        <SupplierOldDebtsDetail />
      </ProtectedRoute>
    )
  },
  {
    path: "/debts/suppliers/:supplierId/new-debts",
    element: (
      <ProtectedRoute>
        <SupplierNewDebtsDetail />
      </ProtectedRoute>
    )
  },
  {
    path: "/debts/clients",
    element: (
      <ProtectedRoute>
        <ClientDebts />
      </ProtectedRoute>
    )
  },
  {
    path: "/debts/clients/:clientId/old-debts",
    element: (
      <ProtectedRoute>
        <ClientOldDebtsDetail />
      </ProtectedRoute>
    )
  },
  
  // Products Routes (Protected)
  {
    path: "/products",
    element: (
      <ProtectedRoute>
        <ProductsSuppliers />
      </ProtectedRoute>
    )
  },
  {
    path: "/products/:supplierId",
    element: (
      <ProtectedRoute>
        <ProductsBySupplier />
      </ProtectedRoute>
    )
  },
  {
    path: "/products/:supplierId/:productId",
    element: (
      <ProtectedRoute>
        <ProductDetail />
      </ProtectedRoute>
    )
  },

  // Authentication Routes
  {
    path: "/auth/sign-in",
    element: <SignIn />
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPassword />
  },

  // Error Pages
  {
    path: "/errors/unauthorized",
    element: <Unauthorized />
  },
  {
    path: "/errors/forbidden",
    element: <Forbidden />
  },
  {
    path: "/errors/not-found",
    element: <NotFound />
  },
  {
    path: "/errors/internal-server-error",
    element: <InternalServerError />
  },
  {
    path: "/errors/under-maintenance",
    element: <UnderMaintenance />
  },

  // Settings Routes (Protected)
  {
    path: "/settings/user",
    element: (
      <ProtectedRoute>
        <UserSettings />
      </ProtectedRoute>
    )
  },
  {
    path: "/settings/appearance",
    element: (
      <ProtectedRoute>
        <AppearanceSettings />
      </ProtectedRoute>
    )
  },

  // Catch-all route for 404
  {
    path: "*",
    element: <NotFound />
  }
]
