// Exact backend enum names; labels are presentation only.
export const PLAN_STATUS=Object.freeze({Active:'Active',Paused:'Paused',Completed:'Completed',Archived:'Archived'});
export const SESSION_STATUS=Object.freeze({Planned:'Planned',Assigned:'Assigned',InProgress:'InProgress',Completed:'Completed',Skipped:'Skipped',IssueReported:'IssueReported'});
export const INTENSITY=Object.freeze({Light:'Light',Moderate:'Moderate',Heavy:'Heavy'});
export const TRAINING_TYPE=Object.freeze({Walk:'Walk',Trot:'Trot',Canter:'Canter',Gallop:'Gallop',Sprint:'Sprint',Recovery:'Recovery',StartingGate:'StartingGate'});
// Giá trị mặt sân được lưu trong dữ liệu (Templates/Plans/Sessions.Surface) và khớp mặc định "Cát" của Backend.
// Đây là dữ liệu đã lưu, không phải nhãn giao diện; người dùng vẫn có thể nhập mặt sân khác.
export const TRAINING_SURFACE=Object.freeze({Sand:'Cát',Turf:'Cỏ',Dirt:'Đất',Synthetic:'Đường đua tổng hợp'});
