import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from '@/pages/Welcome/WelcomeScreen';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import SetupPinPage from '@/pages/Auth/SetupPinPage';
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage';
import Dashboard from '@/pages/Dashboard/Dashboard';
import AddMeasurementPage from '@/pages/Measurement/AddMeasurementPage';
import ReminderSettingsPage from '@/pages/Settings/ReminderSettingsPage';
import AccessibilitySettingsPage from '@/pages/Settings/AccessibilitySettingsPage';
import ProfileSettingsPage from '@/pages/Settings/ProfileSettingsPage';
import BackupSettingsPage from '@/pages/Settings/BackupSettingsPage';
import HistoryPage from '@/pages/History/HistoryPage';
import ReportsPage from '@/pages/Reports/ReportsPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import NutritionPage from '@/pages/Nutrition/NutritionPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/setup-pin" element={<SetupPinPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/add-measurement" element={
        <ProtectedRoute>
          <AddMeasurementPage />
        </ProtectedRoute>
      } />
      <Route path="/reminder-settings" element={
        <ProtectedRoute>
          <ReminderSettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      } />
      <Route path="/nutrition" element={
        <ProtectedRoute>
          <NutritionPage />
        </ProtectedRoute>
      } />
      <Route path="/accessibility" element={
        <ProtectedRoute>
          <AccessibilitySettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfileSettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/backup" element={
        <ProtectedRoute>
          <BackupSettingsPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;