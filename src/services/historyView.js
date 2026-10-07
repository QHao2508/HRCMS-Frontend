import { getEnumLabel } from "../constants/enumLabels.js";
import { MSG, msg } from "../messages/index.js";
/**
 * Đọc snapshot JSON lịch sử dạng cũ/mới, chuyển thành nhãn/dòng hiển thị mà không xuất các ID nội bộ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param snapshot JSON lịch sử đã lưu; chỉ parse và hiển thị các trường cần thiết.
 */
export function historyView(snapshot) {
    let data;
    try { data=JSON.parse(snapshot); } catch { return null; }
    if(!data || typeof data!=="object" || Array.isArray(data))return null;
    const source=data.session || data;
    const rows=[];
    /**
     * Đưa một giá trị snapshot đơn giản vào dòng hiển thị; bỏ cấu trúc không hợp lệ hoặc dữ liệu không cần xuất.
     * @param label Giá trị label truyền vào add; tham chiếu phần thân để xem cách dùng.
     * @param value Giá trị value truyền vào add; tham chiếu phần thân để xem cách dùng.
     */
    function add(label,value){if(typeof value==="string" && value || typeof value==="number")rows.push([label,String(value)]);}
    add(msg(MSG.MUC_TIEU),source.target || source.goal);add(msg(MSG.QUANG_DUONG_M),source.distanceMetres);add(msg(MSG.CUONG_DO),source.intensity ? getEnumLabel(source.intensity) : null);add(msg(MSG.GHI_CHU),source.notes);
    if(data.result){add(msg(MSG.THOI_GIAN_GIAY),data.result.timeSeconds);add(msg(MSG.TOC_DO_M_S),data.result.speedMetresPerSecond);add(msg(MSG.PHAN_HOI_RIDER),data.result.feedback);}
    if(data.evaluation){add(msg(MSG.NHAN_XET_TRAINER),data.evaluation.comment);if(typeof data.evaluation.adjustFutureSessions==="boolean")add(msg(MSG.DIEU_CHINH_TUONG_LAI),data.evaluation.adjustFutureSessions ? msg(MSG.CO_DE_NGHI) : msg(MSG.KHONG_DE_NGHI));}
    return {title:data.evaluation ? msg(MSG.DANH_GIA_CUA_TRAINER) : data.result ? msg(MSG.KET_QUA_BUOI_TAP) : source.scheduledAt ? msg(MSG.THAY_DOI_BUOI_TAP) : msg(MSG.THAY_DOI_KE_HOACH),status:source.status,rows};
}
