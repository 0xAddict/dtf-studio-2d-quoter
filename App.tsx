import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import DTFQuoter from './components/DTFQuoter';
import { LoginRedirect } from './components/LoginRedirect';
import { MyQuotesPage } from './components/MyQuotesPage';
import { QuoteDetailsPage } from './components/QuoteDetailsPage';
import { AccountPage } from './components/AccountPage';
import { OrderDetailPage } from './components/OrderDetailPage';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminHomePage } from './components/admin/AdminHomePage';
import { AdminOrdersPage } from './components/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './components/admin/AdminOrderDetailPage';
import { AdminCustomersPage } from './components/admin/AdminCustomersPage';
import { AdminFilesPage } from './components/admin/AdminFilesPage';
import { AdminNotificationsPage } from './components/admin/AdminNotificationsPage';
import { AdminNewQuotePage } from './components/admin/AdminNewQuotePage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            {/* DTF 2D quoter — main page */}
            <Route
              path="/"
              element={<DTFQuoter />}
            />

            {/* /quoter alias — same component, supports ?admin=1&assign= param */}
            <Route
              path="/quoter"
              element={<DTFQuoter />}
            />

            {/* My Quotes page (protected) */}
            <Route
              path="/my-quotes"
              element={
                <ProtectedRoute>
                  <MyQuotesPage />
                </ProtectedRoute>
              }
            />

            {/* Quote Details page (protected) */}
            <Route
              path="/quote/:quoteId"
              element={
                <ProtectedRoute>
                  <QuoteDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Account — order history */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />

            {/* Order detail */}
            <Route
              path="/account/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Auth callback for email verification */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* /login — redirects to home and triggers sign-in modal, preserving ?next= param */}
            <Route path="/login" element={<LoginRedirect />} />

            {/* ── Admin routes — gated by RequireAdmin (JWT app_metadata.role=admin) ── */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminHomePage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <RequireAdmin>
                  <AdminOrdersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/orders/:id"
              element={
                <RequireAdmin>
                  <AdminOrderDetailPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <RequireAdmin>
                  <AdminCustomersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/files"
              element={
                <RequireAdmin>
                  <AdminFilesPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <RequireAdmin>
                  <AdminNotificationsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/quotes/new"
              element={
                <RequireAdmin>
                  <AdminNewQuotePage />
                </RequireAdmin>
              }
            />
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
