import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { MobileLayout } from "@/layouts/MobileLayout";
import { AddLeadPage } from "@/pages/AddLeadPage";
import { AdminPage } from "@/pages/AdminPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyLeadsPage } from "@/pages/MyLeadsPage";

function App() {
  return (
    <Routes>
      <Route element={<MobileLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/add-lead" element={<AddLeadPage />} />
        <Route path="/my-leads" element={<MyLeadsPage />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default App;
