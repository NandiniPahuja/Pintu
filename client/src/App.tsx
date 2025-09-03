import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Editor from './pages/Editor'
import Library from './pages/Library'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './lib/AuthContext'
import './styles.css'

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <RootLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Editor />} />
        <Route path="editor" element={<Editor />} />
        <Route path="library" element={<Library />} />
      </Route>
      
      {/* Catch all route - redirect to editor */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App
