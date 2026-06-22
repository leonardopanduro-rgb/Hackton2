import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute.tsx'
import { LoginPage } from './auth/LoginPage.tsx'
import { AppShell } from './layout/AppShell.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { SignalDetailPage } from './pages/SignalDetailPage.tsx'
import { SignalsFeedPage } from './pages/SignalsFeedPage.tsx'
import { SectorsPage } from './pages/SectorsPage.tsx'
import { SectorStoryPage } from './pages/SectorStoryPage.tsx'
import { TropelsPage } from './pages/TropelsPage.tsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tropels', element: <TropelsPage /> },
      { path: 'signals', element: <SignalsFeedPage /> },
      { path: 'signals/:id', element: <SignalDetailPage /> },
      { path: 'sectors', element: <SectorsPage /> },
      { path: 'sectors/:id/story', element: <SectorStoryPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export function App() {
  return <RouterProvider router={router} />
}
