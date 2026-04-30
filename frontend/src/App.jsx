import { Navigate, Route, Routes } from "react-router-dom";
import { MobileLayout } from "@/layouts/MobileLayout";
import { AddLeadPage } from "@/pages/AddLeadPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyLeadsPage } from "@/pages/MyLeadsPage";
import { LeadDetailsPage } from "@/pages/LeadDetailsPage";
import { SignupPage } from "@/pages/SignupPage";
import { AccountPage } from "@/pages/AccountPage";
import { FollowUpsPage } from "@/pages/FollowUpsPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";

function App() {
  return (
    <Routes>
      <Route element={<MobileLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/add-lead" 
          element={
            <ProtectedRoute>
              <AddLeadPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/my-leads" 
          element={
            <ProtectedRoute>
              <MyLeadsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/my-leads/:id" 
          element={
            <ProtectedRoute>
              <LeadDetailsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/follow-ups" 
          element={
            <ProtectedRoute>
              <FollowUpsPage />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
