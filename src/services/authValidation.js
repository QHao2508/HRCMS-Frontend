// Checked-in SecurityOptions/appsettings baseline. The backend remains authoritative;
// it exposes no public policy endpoint. Keep this aligned with deployment overrides.
export const AUTH_POLICY = Object.freeze({
    passwordMinLength: 12,
    passwordMaxLength: 128,
    requireNationalId: false,
    nationalIdDigits: 12,
    resendSeconds: 60,
});

export const passwordHelp = `Use ${AUTH_POLICY.passwordMinLength}–${AUTH_POLICY.passwordMaxLength} characters, including uppercase, lowercase and a digit.`;

export function validateEmail(values) {
    const email = values.email?.trim() || "";
    return /^[^\s@]+@[^\s@]+$/u.test(email) ? {} : { email: "Enter a valid email address." };
}

function validatePasswords(values) {
    const errors = {};
    const password = values.password || "";
    if (password.length < AUTH_POLICY.passwordMinLength || password.length > AUTH_POLICY.passwordMaxLength
        || !/\p{Lu}/u.test(password) || !/\p{Ll}/u.test(password) || !/\p{Nd}/u.test(password)) {
        errors.password = passwordHelp;
    }
    if (!values.confirmPassword || values.confirmPassword !== password) {
        errors.confirmPassword = "Passwords must match.";
    }
    return errors;
}

export function validateRegistration(values) {
    const errors = { ...validateEmail(values), ...validatePasswords(values) };
    for (const [field, label, max, min = 1] of [
        ["firstName", "First name", 100], ["lastName", "Last name", 100],
        ["userName", "Username", 80, 3], ["phone", "Phone", 30], ["address", "Address", 500],
    ]) {
        const value = values[field]?.trim() || "";
        if (value.length < min || value.length > max) errors[field] = `${label} must contain ${min}–${max} characters.`;
    }
    if ((values.email?.trim().length || 0) > 254) errors.email = "Email must be 254 characters or fewer.";
    const nationalId = values.nationalId?.trim() || "";
    if (AUTH_POLICY.requireNationalId && !nationalId) errors.nationalId = "National ID is required.";
    else if (nationalId && !new RegExp(`^[0-9]{${AUTH_POLICY.nationalIdDigits}}$`).test(nationalId)) {
        errors.nationalId = `National ID must contain exactly ${AUTH_POLICY.nationalIdDigits} digits.`;
    }
    return errors;
}

export function validateVerification(values) {
    const errors = validateEmail(values);
    if (!/^[0-9]{6}$/.test(values.code?.trim() || "")) errors.code = "Enter the six-digit verification code.";
    return errors;
}

export function validatePasswordSetup(values) {
    const errors = { ...validateEmail(values), ...validatePasswords(values) };
    if (!values.code?.trim() || values.code.trim().length > 4000) errors.code = "Enter the code from your email.";
    return errors;
}

// No email or code is read from the URL; direct navigation always has an editable fallback.
export function getNavigationEmail(state) {
    return typeof state?.email === "string" && state.email.length <= 254 ? state.email : "";
}
