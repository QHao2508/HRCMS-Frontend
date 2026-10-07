export default function TrainingPlanMedicalContext({ horseDetail, restrictions = [] }) {
    return <section className="border rounded p-3 mb-3" aria-labelledby="plan-medical-context">
        <h2 id="plan-medical-context" className="h5">Medical restriction context</h2>
        <p>Horse health status: <strong>{horseDetail?.horse?.healthStatus || "Not returned"}</strong></p>
        <p className="text-body-secondary">These are uncleared restrictions returned with this plan. Their validity dates determine whether they apply to a future session. Training staff cannot override them.</p>
        {!restrictions.length ? <p>No uncleared medical restrictions were returned.</p> : <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Reason</th><th>Validity</th><th>Limits</th><th>Medical reference</th></tr></thead>
            <tbody>{restrictions.map((restriction) => <tr key={restriction.id}>
                <td>{restriction.reason || "No operational reason returned"}</td>
                <td>{restriction.validFrom || "Not provided"} to {restriction.validUntil || "No end returned"}</td>
                <td>{[
                    restriction.trainingLock && "Training Lock (Heavy)", restriction.blockAllTraining && "Block all training",
                    restriction.maxIntensity && `Maximum intensity: ${restriction.maxIntensity}`,
                    restriction.maxDistanceMetres != null && `Maximum distance: ${restriction.maxDistanceMetres} m`, restriction.noSprint && "No Sprint",
                ].filter(Boolean).join("; ") || "No limit fields returned"}</td>
                <td>{restriction.medicalRecordId || "Not provided"}</td>
            </tr>)}</tbody>
        </table></div>}
    </section>;
}
