const value = (item) => item == null || item === "" ? "—" : String(item);
const pair = (first, second) => [first, second].filter((item) => item != null && item !== "").map(String).join(" · ") || "—";

function Fact({ label, children }) {
    return <div><dt>{label}</dt><dd>{children}</dd></div>;
}

export default function RegistrationSummary({ record, attachments, editControl, editForm }) {
    const measurement = [record.heightCm != null ? String(record.heightCm) + " cm" : null,
        record.weightKg != null ? String(record.weightKg) + " kg" : null].filter(Boolean).join(" · ") || "—";
    return <div className="hrcms-manager-review-sections">
        <section className="hrcms-registration-card" aria-labelledby="manager-identity-title">
            <div className="hrcms-manager-card-heading"><h2 id="manager-identity-title">01 / Nhận diện và phả hệ</h2>{editControl}</div>
            <dl className="hrcms-manager-facts">
                <Fact label="Tên / giống / giới tính">{[record.name, record.breed, record.gender].filter(Boolean).join(" · ") || "—"}</Fact>
                <Fact label="Ngày sinh / mã bên ngoài">{pair(record.dateOfBirth, record.registrationNumber)}</Fact>
                <Fact label="Sire / Dam">{pair(record.sire, record.dam)}</Fact>
                <Fact label="Chủ sở hữu">{value(record.ownerId)}</Fact>
            </dl>
        </section>
        {editForm}
        <section className="hrcms-registration-card" aria-labelledby="manager-documents-title">
            <h2 id="manager-documents-title">02 / Giấy tờ và thông tin thể chất</h2>
            {attachments}
            <dl className="hrcms-manager-facts">
                <Fact label="Số đo gần nhất">{measurement}</Fact>
                <Fact label="Ngày đo">{value(record.measurementDate)}</Fact>
            </dl>
            <p className="hrcms-manager-section-note">Thông tin giấy chứng nhận được hiển thị theo metadata của từng tài liệu.</p>
        </section>
        <section className="hrcms-registration-card" aria-labelledby="manager-health-title">
            <h2 id="manager-health-title">03 / Khai báo sức khỏe của Owner</h2>
            <p className="hrcms-manager-health-text">{value(record.declaredHealth)}</p>
            {record.healthNotes && <p className="hrcms-manager-health-notes">{record.healthNotes}</p>}
            <p className="hrcms-registration-card-description">Đây là thông tin khai báo, không phải chẩn đoán của Veterinarian.</p>
        </section>
        <section className="hrcms-registration-card" aria-labelledby="manager-boarding-title">
            <h2 id="manager-boarding-title">04 / Thời gian gửi và nhân sự đề xuất</h2>
            <dl className="hrcms-manager-facts">
                <Fact label="Thời gian dự kiến">{pair(record.boardingStart, record.boardingEnd)}</Fact>
                <Fact label="Head Trainer đề xuất">{value(record.preferredHeadTrainerId)}</Fact>
                <Fact label="Groom đề xuất">{value(record.preferredGroomId)}</Fact>
                <Fact label="Veterinarian đề xuất">{value(record.preferredVeterinarianId)}</Fact>
            </dl>
            <p className="hrcms-registration-card-description">Nhân sự đề xuất chưa phải phân công chính thức. Phê duyệt không tự phân công nhân sự.</p>
        </section>
        <section className="hrcms-registration-card" aria-labelledby="manager-log-title">
            <h2 id="manager-log-title">05 / Nhật ký quản lý</h2>
            {record.reviewReason ? <div className="hrcms-registration-review-reason"><strong>Lý do yêu cầu bổ sung</strong><p>{record.reviewReason}</p></div>
                : <p className="hrcms-manager-section-note">Chưa có dữ liệu nhật ký quản lý trong hồ sơ hiện tại.</p>}
        </section>
    </div>;
}
