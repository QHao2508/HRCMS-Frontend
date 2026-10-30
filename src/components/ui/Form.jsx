import { useId } from 'react';
import { Check } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';
import '../../style/ui.css';

/** Nhóm ô nhập có tiêu đề và mô tả (mẫu M6); dùng fieldset để trình đọc màn hình đọc đúng nhóm. */
export function FormSection({ title, description, children }) {
    const descriptionId = useId();
    return <fieldset className="hc-form-section" aria-describedby={description ? descriptionId : undefined}>
        <legend>{title}</legend>
        {description && <p id={descriptionId} className="hc-form-section-help">{description}</p>}
        <div className="hc-form-grid">{children}</div>
    </fieldset>;
}

/** Thanh nút dính đáy màn hình khi cuộn form dài; nút chính đặt cuối. */
export function StickyFormActions({ children, note }) {
    return <div className="hc-sticky-actions">{note && <span className="hc-sticky-note" role="status">{note}</span>}<div className="hc-sticky-buttons">{children}</div></div>;
}

/**
 * Thanh bước đánh số cho wizard (mẫu M6). Bước đã qua có dấu tích; bấm được khi có onSelect.
 * @param options0 { steps: [label], current (0-based), onSelect, invalid: Set<number>, disabled, label }.
 */
export function Stepper({ steps, current, onSelect, invalid, disabled = false, label, buttonClassName }) {
    return <ol className="hc-stepper" aria-label={label}>{steps.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        const hasError = invalid?.has?.(index);
        const content = <><span className="hc-step-index" aria-hidden="true">{state === 'done' ? <Check size={14} /> : index + 1}</span><span className="hc-step-label">{label}</span>
            <span className="visually-hidden">{msg(MSG.UI_STEP_N, { n: index + 1 })}{state === 'done' ? `, ${msg(MSG.UI_STEP_DONE)}` : state === 'current' ? `, ${msg(MSG.UI_STEP_CURRENT)}` : ''}</span></>;
        return <li key={label} className={`is-${state}${hasError ? ' has-error' : ''}`} aria-current={state === 'current' ? 'step' : undefined}>
            {onSelect ? <button type="button" className={buttonClassName} disabled={disabled} onClick={() => onSelect(index)}>{content}</button> : <span>{content}</span>}
        </li>;
    })}</ol>;
}
