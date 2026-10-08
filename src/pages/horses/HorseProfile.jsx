import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import AdministrativeAssignment from "../../components/horses/AdministrativeAssignment.jsx";
import TrainerAssignment from "../../components/horses/TrainerAssignment.jsx";
import { getHorse } from "../../services/horseService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { HORSE_GENDERS } from "../../constants/registration.js";
import HealthStatus from "../../components/horses/HealthStatus.jsx";
import HorseError from "../../components/horses/HorseError.jsx";
import HorsePhoto from "../../components/horses/HorsePhoto.jsx";
import HorseAssignments from "../../components/horses/HorseAssignments.jsx";
import "../../style/registration.css";
import "../../style/horse.css";

const shown = (value) => value === null || value === undefined || value === "" ? "Chưa cung cấp" : value;
const joined = (...values) => values.filter((value) => value !== null && value !== undefined && value !== "").join(" · ") || "Chưa cung cấp";

function Fields({ values }) {
    return <dl className="hrcms-horse-facts">{values.map(([label, value]) => <div key={label}>
        <dt>{label}</dt><dd>{shown(value)}</dd>
    </div>)}</dl>;
}
export function HorseProfileContent({ data, assignmentControls }) {
    if (!data?.horse) return <p className="hrcms-horse-empty" role="status">Không có chi tiết hồ sơ ngựa được trả về.</p>;
    const { horse, latestMeasurement, preferences, assignments, currentStall } = data;
    const gender = HORSE_GENDERS.includes(horse.gender) ? horse.gender : "Không rõ giới tính";
    const measurement = latestMeasurement ? joined(
        latestMeasurement.heightCm != null ? latestMeasurement.heightCm + " cm" : null,
        latestMeasurement.weightKg != null ? latestMeasurement.weightKg + " kg" : null) : "Chưa có số đo";
    return <div className="hrcms-horse-profile-content">
        <header className="hrcms-registration-heading hrcms-horse-profile-heading">
            <h1>{horse.name || "Hồ sơ ngựa"}</h1>
            <p>{shown(horse.registrationNumber)} · Horse Profile · Chủ sở hữu: {shown(horse.ownerId)}</p>
        </header>
        <div className="hrcms-registration-info" role="note">
            <img src="/figma/auth/info.svg" alt="" width="20" height="20" />
            <span>Thông tin hồ sơ và thời gian lưu trú được hiển thị theo dữ liệu hiện có.</span>
        </div>
        <div className="hrcms-horse-profile-status"><span className="hrcms-horse-status-label">Sức khỏe:</span><HealthStatus value={horse.healthStatus} />
            {horse.archived === true && <span className="hrcms-horse-archive-status">Đã lưu trữ</span>}</div>
        <nav className="hrcms-horse-section-nav" aria-label="Các phần hồ sơ">
            <a href="#horse-overview">Tổng quan</a>
            <a href="#horse-health">Sức khỏe</a>
            <a href="#horse-current-assignments">Nhân sự</a>
            <a href="#horse-measurements">Số đo</a>
        </nav>
        <section id="horse-overview" className="hrcms-registration-card hrcms-horse-overview" aria-labelledby="horse-overview-title">
            <h2 id="horse-overview-title">Thông tin ngựa</h2>
            <div className="hrcms-horse-identity">
                <div className="hrcms-horse-profile-photo">
                    <HorsePhoto key={horse.id} horseId={horse.id} name={horse.name} />
                </div>
                <div className="hrcms-horse-identity-text">
                    <h3>{horse.name || "Ngựa chưa đặt tên"}</h3>
                    <p>{joined(horse.registrationNumber, horse.id)} · HRCMS</p>
                    <p>Chủ sở hữu: {shown(horse.ownerId)}</p>
                </div>
            </div>
            <Fields values={[
                ["Giống / giới tính / ngày sinh", joined(horse.breed, gender, horse.dateOfBirth)],
                ["Phả hệ — Sire / Dam", joined(horse.sire, horse.dam)],
                ["Số đo gần nhất", measurement],
                ["Thời gian gửi dự kiến", joined(horse.boardingStart, horse.boardingEnd)],
                ["Vị trí chuồng", currentStall?.stallId || "Chưa có vị trí chuồng"],
                ["Mã yêu cầu đăng ký", horse.registrationId],
                ["Ngày đo gần nhất", latestMeasurement?.date],
                ["Mã lần lưu chuồng", currentStall?.id],
                ["Thời điểm ghi nhận chuồng", currentStall?.createdAt],
            ]} />
        </section>
        <section id="horse-health" className="hrcms-registration-card hrcms-horse-health" aria-labelledby="horse-health-title">
            <h2 id="horse-health-title">Sức khỏe và huấn luyện</h2>
            <Fields values={[
                ["Current Health Status / Sức khỏe hiện tại", <HealthStatus key="status" value={horse.healthStatus} />],
                ["Trainer trực tiếp", (assignments || []).find((assignment) => assignment.role === "Trainer" && assignment.active === true)?.staffId || "Chưa phân công"],
            ]} />
            <p className="hrcms-horse-section-note">Tình trạng hồ sơ hành chính được theo dõi riêng với sức khỏe và điều kiện huấn luyện.</p>
        </section>
        <HorseAssignments assignments={assignments} preferences={preferences} />
        <section id="horse-measurements" className="hrcms-registration-card hrcms-horse-measurements" aria-labelledby="horse-measurements-title">
            <h2 id="horse-measurements-title">Lịch sử số đo</h2>
            <div className="hrcms-registration-table-scroll"><table className="hrcms-registration-table">
                <thead><tr><th scope="col">Ngày đo</th><th scope="col">Chiều cao</th><th scope="col">Cân nặng</th></tr></thead>
                <tbody><tr><td>{shown(latestMeasurement?.date)}</td>
                    <td>{latestMeasurement?.heightCm == null ? "—" : latestMeasurement.heightCm + " cm"}</td>
                    <td>{latestMeasurement?.weightKg == null ? "—" : latestMeasurement.weightKg + " kg"}</td></tr></tbody>
            </table></div>
            <p className="hrcms-horse-section-note">Hiển thị số đo mới nhất được trả về cùng hồ sơ.</p>
        </section>
        <div className="hrcms-horse-assignment-controls">{assignmentControls}</div>
    </div>;
}
function LoadedProfile({ initialData, actorRole, user, onReload }) {
    const [updated, setUpdated] = useState(null);
    const data = updated || initialData;
    return <HorseProfileContent data={data} assignmentControls={<>
        <AdministrativeAssignment actorRole={actorRole} data={data} onUpdated={setUpdated} onReload={onReload} />
        <TrainerAssignment user={user} data={data} onUpdated={setUpdated} onReload={onReload} />
    </>} />;
}
export function HorseProfileResult({ resource, actorRole, user }) {
    if (resource.loading) return <p className="hrcms-registration-pending" role="status">Đang tải hồ sơ ngựa...</p>;
    if (resource.error) return <div className="hrcms-horse-resource-error">
        <HorseError error={resource.error} />
        <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={resource.reload}>Thử lại hồ sơ</button>
    </div>;
    return <LoadedProfile initialData={resource.data} actorRole={actorRole} user={user} onReload={resource.reload} />;
}
export default function HorseProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const load = useCallback(() => getHorse(id), [id]);
    const resource = useRegistrationResource(load);
    return <section className="hrcms-registration-page hrcms-horse-page hrcms-horse-profile">
        <Link className="hrcms-horse-back" to="/horses">← Về danh sách ngựa</Link>
        <HorseProfileResult key={id} resource={resource} actorRole={user?.role} user={user} />
    </section>;
}
