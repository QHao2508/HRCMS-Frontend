import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPassword from "../pages/auth/ForgotPassword";
import OtpVerification from "../pages/auth/OtpVerification";
import TrainingDashboard from "../pages/training/TrainingDashboard";
import MedicalDashboard from "../pages/medical/MedicalDashboard";

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/forgot-password"
                element={<ForgotPassword />}
            />

            <Route
                path="/otp-verification"
                element={<OtpVerification />}
            />

            <Route
                path="/training"
                element={
                    <ProtectedRoute>
                        <TrainingDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/medical"
                element={
                    <ProtectedRoute>
                        <MedicalDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <h1>Dashboard</h1>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default AppRoutes;