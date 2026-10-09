import { Routes,Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ResetPassword from "../pages/auth/ResetPassword";
import AcceptInvitation from "../pages/auth/AcceptInvitation";
import AppLayout from "../layouts/AppLayout";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home.jsx";
import PermissionDenied from "../pages/PermissionDenied";
import NotFound from "../pages/NotFound";
import StaffPage from '../pages/manager/StaffPage.jsx';
import AuditPage from '../pages/manager/AuditPage.jsx';
import WebsitePage from '../pages/manager/WebsitePage.jsx';
import RoleRoute from "./RoleRoute";
import { ROLES,ALL_ROLES } from "../constants/roles.js";
import { TRAINING_ROLES } from "./navigation.js";
import RegistrationList from "../pages/registrations/RegistrationList.jsx";
import RegistrationCreate from "../pages/registrations/RegistrationCreate.jsx";
import RegistrationDetail from "../pages/registrations/RegistrationDetail.jsx";
import { ReviewList,ReviewDetail } from "../pages/reviews/ReviewPages.jsx";
import { HorseList,HorseDetail } from "../pages/horses/HorsePages.jsx";
import { TemplateList } from "../pages/training/TemplatePages.jsx";
import { PlanList,PlanCreate,PlanDetail } from "../pages/training/PlanPages.jsx";
import { SessionList,SessionCreate,SessionDetail } from "../pages/training/SessionPages.jsx";
/**
 * Khai báo route public/protected và giới hạn role; nối URL với page/layout tương ứng.
 */
export default function AppRoutes() {return <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
    <Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/verify-email" element={<VerifyEmail/>}/>
    <Route path="/reset-password" element={<ResetPassword/>}/><Route path="/accept-invitation" element={<AcceptInvitation/>}/>
    <Route element={<RoleRoute/>}><Route element={<AppLayout/>}>
        <Route path="/dashboard" element={<Dashboard/>}/><Route path="/permission-denied" element={<PermissionDenied/>}/>
        <Route element={<RoleRoute allowedRoles={ROLES.HorseOwner}/>}><Route path="/registrations" element={<RegistrationList/>}/><Route path="/registrations/new" element={<RegistrationCreate/>}/><Route path="/registrations/:id" element={<RegistrationDetail/>}/></Route>
        <Route element={<RoleRoute allowedRoles={ROLES.ClubManager}/>}><Route path="/manager/staff" element={<StaffPage/>}/><Route path="/manager/audit" element={<AuditPage/>}/><Route path="/manager/website" element={<WebsitePage/>}/><Route path="/reviews" element={<ReviewList/>}/><Route path="/reviews/:id" element={<ReviewDetail/>}/></Route>
        <Route element={<RoleRoute allowedRoles={ALL_ROLES}/>}><Route path="/horses" element={<HorseList/>}/><Route path="/horses/:id" element={<HorseDetail/>}/></Route>
        <Route element={<RoleRoute allowedRoles={[ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer]}/>}><Route path="/training/templates" element={<TemplateList/>}/></Route>
        <Route element={<RoleRoute allowedRoles={TRAINING_ROLES}/>}><Route path="/training/plans" element={<PlanList/>}/><Route path="/training/plans/:id" element={<PlanDetail/>}/><Route path="/training/sessions" element={<SessionList/>}/><Route path="/training/sessions/:id" element={<SessionDetail/>}/></Route>
        <Route element={<RoleRoute allowedRoles={ROLES.Trainer}/>}><Route path="/training/plans/new" element={<PlanCreate/>}/><Route path="/training/plans/:id/sessions/new" element={<SessionCreate/>}/></Route>
    </Route></Route><Route path="*" element={<NotFound/>}/>
</Routes>;}
