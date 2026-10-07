import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPassword from "../pages/auth/ForgotPassword";
import OtpVerification from "../pages/auth/OtpVerification";
import TrainingDashboard from "../pages/training/TrainingDashboard";
import StandardTrainingTemplates from "../pages/training/StandardTrainingTemplates";
import TrainingPlans from "../pages/training/TrainingPlans";
import TrainingSessions from "../pages/training/TrainingSessions";
import WorkRiderExecution from "../pages/training/WorkRiderExecution";
import TrainerEvaluation from "../pages/training/TrainerEvaluation";
import MedicalDashboard from "../pages/medical/MedicalDashboard";
import MedicalInjury from "../pages/medical/MedicalInjury";
import MedicalExamination from "../pages/medical/MedicalExamination";
import MedicalTreatment from "../pages/medical/MedicalTreatment";
import MedicalRestrictions from "../pages/medical/MedicalRestrictions";
import MedicalFollowUp from "../pages/medical/MedicalFollowUp";

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
                path="/training/templates"
                element={
                    <ProtectedRoute>
                        <StandardTrainingTemplates />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/training/plans"
                element={
                    <ProtectedRoute>
                        <TrainingPlans />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/training/sessions"
                element={
                    <ProtectedRoute>
                        <TrainingSessions />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/training/work-rider"
                element={
                    <ProtectedRoute>
                        <WorkRiderExecution />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/training/evaluation"
                element={
                    <ProtectedRoute>
                        <TrainerEvaluation />
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
                path="/medical/injury"
                element={
                    <ProtectedRoute>
                        <MedicalInjury />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/medical/examination"
                element={
                    <ProtectedRoute>
                        <MedicalExamination />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/medical/treatment"
                element={
                    <ProtectedRoute>
                        <MedicalTreatment />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/medical/restrictions"
                element={
                    <ProtectedRoute>
                        <MedicalRestrictions />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/medical/follow-up"
                element={
                    <ProtectedRoute>
                        <MedicalFollowUp />
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