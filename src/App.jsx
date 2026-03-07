import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

// Admin pages
import AdminLayout from './pages/AdminLayout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Tables from './pages/Tables'
import Users from './pages/Users'



// Waiter pages
import WaiterLayout from './pages/WaiterLayout'
import Orders from './pages/Orders'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas ADMIN */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="tables" element={<Tables />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
        </Route>

        {/* Rutas WAITER */}
        <Route path="/waiter" element={
          <ProtectedRoute roles={['WAITER']}>
            <WaiterLayout />
          </ProtectedRoute>
        }>
          <Route path="orders" element={<Orders />} />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}