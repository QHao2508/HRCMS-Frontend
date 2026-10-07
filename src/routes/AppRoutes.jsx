import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ResetPassword from "../pages/auth/ResetPassword";
import AcceptInvitation from "../pages/auth/AcceptInvitation";
import AppLayout from "../layouts/AppLayout";
import Dashboard from "../pages/Dashboard";
import PermissionDenied from "../pages/PermissionDenied";
import NotFound from "../pages/NotFound";
import RoleRoute from "./RoleRoute";
import { ROLES } from "../constants/roles.js";
import RegistrationList from "../pages/registrations/RegistrationList.jsx";
import RegistrationCreate from "../pages/registrations/RegistrationCreate.jsx";
import RegistrationDetail from "../pages/registrations/RegistrationDetail.jsx";
import RegistrationQueue from "../pages/management/RegistrationQueue.jsx";
import RegistrationReview from "../pages/management/RegistrationReview.jsx";
import HorseList from "../pages/horses/HorseList.jsx";
import HorseProfile from "../pages/horses/HorseProfile.jsx";
import { HORSE_BROWSING_ROLES } from "../constants/horses.js";
import { TRAINING_TEMPLATE_ROLES } from "../constants/training.js";
import TrainingTemplates from "../pages/training/TrainingTemplates.jsx";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route element={<RoleRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/permission-denied" element={<PermissionDenied />} />
                    <Route element={<RoleRoute allowedRoles={HORSE_BROWSING_ROLES} />}>
                        <Route path="/horses" element={<HorseList />} />
                        <Route path="/horses/:id" element={<HorseProfile />} />
                    </Route>
                    <Route element={<RoleRoute allowedRoles={TRAINING_TEMPLATE_ROLES} />}>
                        <Route path="/training/templates" element={<TrainingTemplates />} />
                    </Route>
                    <Route element={<RoleRoute allowedRoles={ROLES.HorseOwner} />}>
                        <Route path="/registrations" element={<RegistrationList />} />
                        <Route path="/registrations/new" element={<RegistrationCreate />} />
                        <Route path="/registrations/:id" element={<RegistrationDetail />} />
                    </Route>
                    <Route element={<RoleRoute allowedRoles={ROLES.ClubManager} />}>
                        <Route path="/management/registrations" element={<RegistrationQueue />} />
                        <Route path="/management/registrations/:id" element={<RegistrationReview />} />
                    </Route>
                </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default AppRoutes;
