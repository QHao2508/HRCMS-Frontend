import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { FORM_SECTIONS } from "../../services/registrationValidation.js";
import { WIZARD_STEPS, FIELD_LABELS, SECTION_STEPS } from "../../constants/registrationWizard.js";
/**
 * Render thứ tự các bước và aria-current, cho chuyển bước khi không có thao tác đang chạy.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { step, onChange, disabled }. Các props/callback lấy từ caller.
 */
export function WizardSteps({ step, onChange, disabled }) { return <nav className="wizard-steps" aria-label={msg(MSG.CAC_BUOC_DANG_KY_NGUA)}>{WIZARD_STEPS.map((label,index) => <button type="button" key={label} className="wizard-step" aria-current={step === index ? "step" : undefined} disabled={disabled} onClick={() => onChange(index)}><span className="wizard-step-number">{index + 1}{msg(MSG.SYMBOL_3)}</span>{label}</button>)}</nav>; }
/**
 * Đọc các trường intake theo section để người dùng kiểm tra trước gửi; enum giới tính được Việt hóa, dữ liệu nhập giữ nguyên.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { record }. Các props/callback lấy từ caller.
 */
export function RegistrationSummary({ record }) { return <>{FORM_SECTIONS.map(section => <section className="surface-card" key={section.title}><h2>{WIZARD_STEPS[SECTION_STEPS[section.title]]}</h2><dl className="summary-grid">{section.fields.map(field => <div key={field.name}><dt>{FIELD_LABELS[field.name]}</dt><dd>{record[field.name] == null || record[field.name] === "" ? msg(MSG.CHUA_NHAP) : field.name === "gender" ? getEnumLabel(record[field.name]) : field.name === "gender" ? getEnumLabel(record[field.name]) : String(record[field.name])}</dd></div>)}</dl></section>)}</>; }
