import { isKnownRole } from "../../constants/roles.js";

function AssignmentTable({ assignments }) {
    return <div className="table-responsive"><table className="table align-middle">
        <thead><tr><th>Role</th><th>Staff ID</th><th>Start date</th><th>End date</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>{assignments.map((assignment) => <tr key={assignment.id}>
            <td>{isKnownRole(assignment.role) ? assignment.role : "Unrecognized role"}</td>
            <td>{assignment.staffId || "Not provided"}</td><td>{assignment.startDate || "Not provided"}</td>
            <td>{assignment.endDate || "Not provided"}</td>
            <td>{assignment.active === true ? "Active" : assignment.active === false ? "Inactive" : "Unknown"}</td>
            <td style={{ whiteSpace: "pre-wrap" }}>{assignment.notes || "—"}</td>
        </tr>)}</tbody>
    </table></div>;
}
export default function HorseAssignments({ assignments = [] }) {
    const records = Array.isArray(assignments) ? assignments : [];
    const current = records.filter((assignment) => assignment.active === true);
    return <>
        <section className="border rounded p-3 mb-3" aria-labelledby="horse-current-assignments">
            <h2 id="horse-current-assignments" className="h5">Current official assignments</h2>
            {current.length ? <AssignmentTable assignments={current} /> : <p>No current official assignments returned.</p>}
        </section>
        <section className="border rounded p-3 mb-3" aria-labelledby="horse-assignment-history">
            <h2 id="horse-assignment-history" className="h5">Assignment history</h2>
            <p>All returned assignment records, including current assignments.</p>
            {records.length ? <AssignmentTable assignments={records} /> : <p>No assignment history returned.</p>}
        </section>
    </>;
}
