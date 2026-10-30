import { displayDate } from '../../services/displayDate.js';
import { getEnumLabel } from "../../constants/enumLabels.js";
import { externalRegistrationNumber } from "../../services/horseIdentifiers.js";
import { MSG, msg } from "../../messages/index.js";
import { FORM_SECTIONS } from "../../services/registrationValidation.js";
import { WIZARD_STEPS, FIELD_LABELS, SECTION_TITLES } from "../../constants/registrationWizard.js";
import '../../style/registration-review.css';
import { registrationFieldStep } from '../../services/registrationFocus.js';
import { Stepper } from '../ui/Form.jsx';
/**
 * Render thứ tự các bước và aria-current, cho chuyển bước khi không có thao tác đang chạy.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { step, onChange, disabled }. Các props/callback lấy từ caller.
 */
export function WizardSteps({ step, onChange, disabled, errors = {} }) { const invalid = new Set(Object.keys(errors).map(name => registrationFieldStep(name))); return <nav className="wizard-stepper" aria-label={msg(MSG.CAC_BUOC_DANG_KY_NGUA)}><Stepper steps={WIZARD_STEPS} current={step} onSelect={onChange} invalid={invalid} disabled={disabled} buttonClassName="wizard-step" /></nav>; }
/**
 * Đọc các trường intake theo section để người dùng kiểm tra trước gửi; enum giới tính được Việt hóa, dữ liệu nhập giữ nguyên.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { record }. Các props/callback lấy từ caller.
 */
export function RegistrationSummary({ record }) {
    const values = { ...record, externalRegistrationNumber: externalRegistrationNumber(record) };
    return <>{FORM_SECTIONS.map(section => <section className="surface-card registration-summary-section" key={section.title}><h2>{SECTION_TITLES[section.title]}</h2><dl className="summary-grid">{section.fields.map(field => <div key={field.name}><dt>{FIELD_LABELS[field.name]}</dt><dd>{values[field.name] == null || values[field.name] === "" ? msg(MSG.CHUA_NHAP) : field.name === "gender" ? getEnumLabel(values[field.name]) : field.type === "date" ? displayDate(values[field.name]) : String(values[field.name])}</dd></div>)}</dl></section>)}</>;
}
