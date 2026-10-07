export function historyView(snapshot) {
    let data;
    try { data=JSON.parse(snapshot); } catch { return null; }
    if(!data || typeof data!=="object" || Array.isArray(data))return null;
    const source=data.session || data;
    const rows=[];
    function add(label,value){if(typeof value==="string" && value || typeof value==="number")rows.push([label,String(value)]);}
    add("Mục tiêu",source.target || source.goal);add("Quãng đường (m)",source.distanceMetres);add("Cường độ",source.intensity);add("Ghi chú",source.notes);
    if(data.result){add("Thời gian (giây)",data.result.timeSeconds);add("Tốc độ (m/s)",data.result.speedMetresPerSecond);add("Phản hồi Rider",data.result.feedback);}
    if(data.evaluation){add("Nhận xét Trainer",data.evaluation.comment);if(typeof data.evaluation.adjustFutureSessions==="boolean")add("Điều chỉnh tương lai",data.evaluation.adjustFutureSessions ? "Có đề nghị" : "Không đề nghị");}
    return {title:data.evaluation ? "Đánh giá của Trainer" : data.result ? "Kết quả buổi tập" : source.scheduledAt ? "Thay đổi buổi tập" : "Thay đổi kế hoạch",status:source.status,rows};
}
