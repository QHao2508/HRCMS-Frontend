import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import MedicalLayout from "../../components/medical/MedicalLayout";

const horses = [
    {
        id: "H-092",
        name: "Silver Comet",
        status: "FIT",
        registration: "APPROVED",
    },
    {
        id: "REG-093",
        name: "Golden Wings",
        status: "MONITORING",
        registration: "PENDING_REVIEW",
    },
];

function MedicalDashboard() {
    return (
        <MedicalLayout>

            {/* Page intro */}
            <div className="medical-page-intro">
                Hệ thống giám sát lâm sàng · Tình trạng sức khỏe & Lịch trình thăm khám
            </div>

            {/* KPI cards */}
            <section className="medical-kpi-grid">

                <div className="medical-kpi-card">
                    <div className="medical-kpi-header">
                        <span>Chiến Mã Khỏe Mạnh (FIT)</span>
                        <span className="status-badge fit">
                            FIT
                        </span>
                    </div>

                    <div className="medical-kpi-number">
                        24
                    </div>

                    <div className="medical-kpi-description">
                        80% tổng số chiến mã hoạt động
                    </div>
                </div>


                <div className="medical-kpi-card">
                    <div className="medical-kpi-header">
                        <span>Cần Giám Sát (MONITORING)</span>

                        <span className="status-badge monitoring">
                            MONITORING
                        </span>
                    </div>

                    <div className="medical-kpi-number monitoring-number">
                        4
                    </div>

                    <div className="medical-kpi-description">
                        Đang hồi phục hoặc theo dõi
                    </div>
                </div>


                <div className="medical-kpi-card">
                    <div className="medical-kpi-header">
                        <span>Chấn Thương (INJURED)</span>

                        <span className="status-badge injured">
                            INJURED
                        </span>
                    </div>

                    <div className="medical-kpi-number injured-number">
                        2
                    </div>

                    <div className="medical-kpi-description">
                        Đang áp dụng phác đồ điều trị
                    </div>
                </div>


                <div className="medical-kpi-card">
                    <div className="medical-kpi-header">
                        <span>Cách Ly (ISOLATED)</span>

                        <span className="status-badge isolated">
                            ISOLATED
                        </span>
                    </div>

                    <div className="medical-kpi-number isolated-number">
                        1
                    </div>

                    <div className="medical-kpi-description">
                        Báo cáo an toàn đặc biệt
                    </div>
                </div>

            </section>


            {/* Attention alert */}
            <section className="medical-attention">

                <h3>
                    YÊU CẦU CHÚ Ý LÂM SÀNG (ATTENTION REQUIRED)
                </h3>

                <ul>
                    <li>
                        Silver Comet (H-092) cần tái khám định kỳ và có xu hướng khập khiễng.
                    </li>

                    <li>
                        Golden Wings (REG-093) đến hạn tiêm phòng cúm và kiểm tra móng (Farrier).
                    </li>

                    <li>
                        2 chiến mã đang bị khóa huấn luyện tự động do hạn chế y tế.
                    </li>
                </ul>

            </section>


            {/* Horse table */}
            <section className="medical-table-card">

                {/* Search/filter row */}
                <div className="medical-table-toolbar">

                    <div className="medical-search">
                        <Search size={14} />

                        <input
                            type="text"
                            placeholder="Tìm kiếm chiến mã..."
                        />
                    </div>

                    <button className="medical-filter-button">
                        Bộ lọc nâng cao
                    </button>

                    <div className="medical-status-filters">

                        <button className="active">
                            Tất cả
                        </button>

                        <button>
                            Monitoring
                        </button>

                        <button>
                            Injured
                        </button>

                    </div>

                </div>


                {/* Table */}
                <div className="medical-table-wrapper">

                    <table className="medical-table">

                        <thead>
                            <tr>
                                <th>Mã Chiến Mã</th>
                                <th>Tên Ngựa</th>
                                <th>Trạng Thái Y Tế</th>
                                <th>Tiến Trình Đăng Ký</th>
                                <th>Thao Tác</th>
                            </tr>
                        </thead>

                        <tbody>

                            {horses.map((horse) => (
                                <tr key={horse.id}>

                                    <td>
                                        <strong className="horse-id">
                                            {horse.id}
                                        </strong>
                                    </td>

                                    <td>
                                        {horse.name}
                                    </td>

                                    <td>
                                        <span
                                            className={`table-status ${horse.status.toLowerCase()}`}
                                        >
                                            {horse.status}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={`registration-status ${horse.registration === "APPROVED"
                                                ? "approved"
                                                : "pending"
                                                }`}
                                        >
                                            {horse.registration}
                                        </span>
                                    </td>

                                    <td>
                                        <button className="view-button">
                                            Xem
                                        </button>
                                    </td>

                                </tr>
                            ))}

                        </tbody>

                    </table>

                </div>


                {/* Pagination */}
                <div className="medical-pagination">

                    <button>
                        <ChevronLeft size={14} />
                    </button>

                    <button className="active">
                        1
                    </button>

                    <button>
                        2
                    </button>

                    <button>
                        3
                    </button>

                    <button>
                        <ChevronRight size={14} />
                    </button>

                </div>

            </section>

        </MedicalLayout>
    );
}

export default MedicalDashboard;