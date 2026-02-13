import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Mapping from './pages/Mapping';
import Analysis from './pages/Analysis';
import Reports from './pages/Reports';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Users from './pages/Users';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex bg-gray-50 text-gray-800 min-h-screen">

          {/* Sidebar */}
          <Sidebar />

          {/* Right Side */}
          <div className="flex-1 ml-64 flex flex-col">

            {/* Top Navbar */}
            <Navbar />

            {/* Content */}
            <div className="flex-1 p-8">
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                } />
                <Route path="/mapping" element={
                  <ProtectedRoute>
                    <Mapping />
                  </ProtectedRoute>
                } />
                <Route path="/analysis" element={
                  <ProtectedRoute>
                    <Analysis />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
  <ProtectedRoute role="admin">
    <Users />
  </ProtectedRoute>
} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </div>

          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
