import { isKnownRole } from "../../constants/roles.js";
import { PREFERENCES } from "../../constants/registration.js";

const staffLabels = { HeadTrainer: "Head Trainer", Groom: "Groom / Stable Hand", Veterinarian: "Veterinarian" };
const staffRoles = [
    ...PREFERENCES.map(({ role, field }) => [role, staffLabels[role], field]),
    ["Trainer", "Trainer", null],
];

function AssignmentTable({ assignments }) {
    return <div className="hrcms-registration-table-scroll"><table className="hrcms-registration-table hrcms-horse-history-table">
        <thead><tr><th scope="col">Vai trò</th><th scope="col">Mã nhân sự</th><th scope="col">Ngày bắt đầu</th>
            <th scope="col">Ngày kết thúc</th><th scope="col">Trạng thái</th><th scope="col">Ghi chú</th></tr></thead>
        <tbody>{assignments.map((assignment) => <tr key={assignment.id}>
            <td>{isKnownRole(assignment.role) ? assignment.role : "Unrecognized role"}</td>
            <td>{assignment.staffId || "Chưa cung cấp"}</td><td>{assignment.startDate || "Chưa cung cấp"}</td>
            <td>{assignment.endDate || "Chưa cung cấp"}</td>
            <td>{assignment.active === true ? "Active" : assignment.active === false ? "Inactive" : "Unknown"}</td>
            <td className="hrcms-horse-notes">{assignment.notes || "—"}</td>
        </tr>)}</tbody>
    </table></div>;
}
export default function HorseAssignments({ assignments = [], preferences }) {
    const records = Array.isArray(assignments) ? assignments : [];
    const current = records.filter((assignment) => assignment.active === true);
    const additionalRoles = current.filter((assignment) => !staffRoles.some(([role]) => role === assignment.role))
        .map((assignment) => assignment.role);
    const roles = [...staffRoles, ...[...new Set(additionalRoles)].map((role) => [role, isKnownRole(role) ? role : "Unrecognized role", null])];
    return <>
        <section className="hrcms-registration-card hrcms-horse-staff" aria-labelledby="horse-current-assignments">
            <h2 id="horse-current-assignments">Nhân sự đề xuất và chính thức</h2>
            <p className="hrcms-registration-card-description">Đề xuất của Owner không phải phân công chính thức.</p>
            <div className="hrcms-registration-table-scroll"><table className="hrcms-registration-table hrcms-horse-staff-table">
                <thead><tr><th scope="col">Vai trò</th><th scope="col">Owner đề xuất</th><th scope="col">Nhân sự chính thức</th></tr></thead>
                <tbody>{roles.map(([role, label, preferenceField]) => <tr key={role}>
                    <td>{label}</td>
                    <td>{preferenceField ? preferences?.[preferenceField] || "Chưa có đề xuất" : "Không thuộc đề xuất Owner"}</td>
                    <td>{current.filter((assignment) => assignment.role === role).map((assignment) => assignment.staffId || "Chưa cung cấp").join(", ") || "Chưa xác nhận"}</td>
                </tr>)}</tbody>
            </table></div>
            {!current.length && <p className="hrcms-horse-section-note">Chưa có nhân sự chính thức được trả về.</p>}
        </section>
        <section className="hrcms-registration-card hrcms-horse-assignment-history" aria-labelledby="horse-assignment-history">
            <h2 id="horse-assignment-history">Lịch sử phân công</h2>
            <p className="hrcms-registration-card-description">Tất cả bản ghi phân công được trả về, gồm cả nhân sự hiện tại.</p>
            {records.length ? <AssignmentTable assignments={records} /> : <p className="hrcms-horse-empty">Chưa có lịch sử phân công được trả về.</p>}
        </section>
    </>;
}
