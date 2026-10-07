import { scheduledPayload } from "./workflowHelpers.js";
/**
 * Chuyển giá trị form buổi tập sang contract API, số/null và lịch UTC theo múi giờ câu lạc bộ.
 * @param form Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server.
 */
export function sessionPayload(form) {return {scheduledAt:scheduledPayload(form.scheduledAt),trainingType:form.trainingType,distanceMetres:Number(form.distanceMetres),intensity:form.intensity,surface:form.surface,target:form.target,notes:form.notes || "",riderId:form.riderId || null};}