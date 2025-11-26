import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ModelViewer from './components/ModelViewer';
import { MyQuotesPage } from './components/MyQuotesPage';
import { QuoteDetailsPage } from './components/QuoteDetailsPage';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            {/* Main model viewer */}
            <Route
              path="/"
              element={
                <main className="w-full h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
                  <ModelViewer />
                </main>
              }
            />

            {/* My Quotes page (protected) */}
            <Route
              path="/my-quotes"
              element={
                <ProtectedRoute>
                  <main className="w-full min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
                    <MyQuotesPage />
                  </main>
                </ProtectedRoute>
              }
            />

            {/* Quote Details page (protected) */}
            <Route
              path="/quote/:quoteId"
              element={
                <ProtectedRoute>
                  <main className="w-full min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
                    <QuoteDetailsPage />
                  </main>
                </ProtectedRoute>
              }
            />

            {/* Auth callback for email verification */}
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
