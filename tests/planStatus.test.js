import assert from "node:assert/strict";
import { test } from "node:test";
import { isPlanOverdue } from "../src/services/planStatus.js";

test("unfinished plan ending yesterday is overdue without changing its state", () => {
    const plan = { status: "Active", endDate: "2026-10-06" };
    assert.equal(isPlanOverdue(plan, "2026-10-07"), true);
    assert.equal(plan.status, "Active");
});
test("end date is inclusive, so today and future dates are not overdue", () => {
    assert.equal(isPlanOverdue({ status: "Active", endDate: "2026-10-07" }, "2026-10-07"), false);
    assert.equal(isPlanOverdue({ status: "Active", endDate: "2026-10-14" }, "2026-10-07"), false);
});
test("paused unfinished plans can be overdue but completed or archived plans are final", () => {
    assert.equal(isPlanOverdue({ status: "Paused", endDate: "2026-10-06" }, "2026-10-07"), true);
    for (const status of ["Completed", "Archived", "UnexpectedStatus"])
        assert.equal(isPlanOverdue({ status, endDate: "2026-10-06" }, "2026-10-07"), false);
});
test("missing or malformed dates never produce a false overdue flag", () => {
    for (const endDate of [null, "", "2026-02-30", "2026-00-01", "not-a-date"])
        assert.equal(isPlanOverdue({ status: "Active", endDate }, "2026-10-07"), false);
});
