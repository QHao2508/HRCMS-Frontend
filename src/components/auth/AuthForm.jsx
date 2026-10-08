import { MSG, msg } from "../../messages/index.js";
import PublicLayout from "../../layouts/PublicLayout.jsx";
import AuthIntro from "./AuthIntro.jsx";
import AuthButton from "./AuthButton.jsx";

/**
 * Dựng form xác thực thống nhất, hiển thị lỗi/trạng thái và khóa fieldset khi đang gửi.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { title, description, form, onSubmit, submitLabel, pendingLabel, success, children, footer, submitDisabled = false }. Các props/callback lấy từ caller.
 */
export default function AuthForm({ title, description, form, onSubmit, submitLabel, pendingLabel,
    success, children, footer, submitDisabled = false }) {
    return (
        <PublicLayout><main className="auth-page"><div className="auth-workspace"><AuthIntro />
            <div className="auth-card">
                <h1>{title}</h1>
                <p>{description}</p>
                {form.error && <div className="alert alert-danger" role="alert">{form.error}</div>}
                {!form.error && Object.values(form.errors).some(Boolean) && (
                    <div className="alert alert-danger" role="alert">{msg(MSG.PLEASE_CHECK_THE_HIGHLIGHTED_FIELDS)}</div>
                )}
                {success && <div className="alert alert-success" role="status">{success}</div>}
                <form noValidate aria-busy={!!form.pending} onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
                    <fieldset disabled={!!form.pending}>
                        {children}
                        <AuthButton pending={!!form.pending} pendingLabel={pendingLabel} disabled={submitDisabled}>
                            {submitLabel}
                        </AuthButton>
                    </fieldset>
                </form>
                <div className="mt-3">{footer}</div>
            </div>
        </div></main></PublicLayout>
    );
}
