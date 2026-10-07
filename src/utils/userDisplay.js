export function getUserDisplayName(user) {
    const fullName = [user?.firstName, user?.lastName]
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim()).join(" ");
    return fullName || (typeof user?.userName === "string" && user.userName.trim()) || "Club member";
}
