/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Crm from './pages/Crm';
import Produtos from './pages/Produtos';
import Trafego from './pages/Trafego';
import Logs from './pages/Logs';
import Infraestrutura from './pages/Infraestrutura';
import Login from './pages/Login';
import Toaster from './components/Toaster';
import { OperacaoProvider } from './context/OperacaoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <OperacaoProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="crm" element={<Crm />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="trafego" element={<Trafego />} />
              <Route path="infraestrutura" element={<Infraestrutura />} />
              <Route path="logs" element={<Logs />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </OperacaoProvider>
    </AuthProvider>
  );
}