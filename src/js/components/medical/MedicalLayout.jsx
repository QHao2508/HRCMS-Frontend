import { NavLink } from "react-router-dom";
import { UserCircle } from "lucide-react";

function MedicalLayout({ children }) {
    return (
        <div className="medical-app">

            {/* Top header */}
            <header className="medical-header">

                <div>
                    <div className="medical-header-small">
                        SWP391 - Racehorse Management - Flow 2
                    </div>

                    <div className="medical-header-title">
                        Bảng Điều Khiển Y Tế (Medical Dashboard)
                    </div>
                </div>

                <div className="medical-user">
                    <div className="medical-user-info">
                        <strong>BS. Lê Thu Hà</strong>
                        <span>Bác Sĩ Thú Y (Veterinarian)</span>
                    </div>

                    <UserCircle size={22} />
                </div>

            </header>

            <div className="medical-body">

                {/* Sidebar */}
                <aside className="medical-sidebar">

                    <div className="medical-sidebar-title">
                        MEDICAL MODULE
                    </div>

                    <nav className="medical-nav">

                        <NavLink
                            to="/medical"
                            end
                            className={({ isActive }) =>
                                `medical-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            F03-A Tổng Quan Y Tế
                        </NavLink>

                        <NavLink
                            to="/medical/examination"
                            className={({ isActive }) =>
                                `medical-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            F03-B Hồ Sơ Thăm Khám
                        </NavLink>

                        <NavLink
                            to="/medical/injury"
                            className={({ isActive }) =>
                                `medical-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            F03-C Ghi Nhận Chấn Thương
                        </NavLink>

                        <NavLink
                            to="/medical/treatment"
                            className={({ isActive }) =>
                                `medical-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            F03-D Phác Đồ Điều Trị
                        </NavLink>

                    </nav>

                    <div className="medical-sidebar-divider" />

                    <div className="medical-actor">

                        <div className="medical-sidebar-title">
                            CURRENT ACTOR
                        </div>

                        <strong>BS. Lê Thu Hà</strong>

                        <span>
                            Clinical decision power for active
                            equine recovery.
                        </span>

                    </div>

                </aside>

                {/* Main content */}
                <main className="medical-content">
                    {children}
                </main>

            </div>

        </div>
    );
}

export default MedicalLayout;