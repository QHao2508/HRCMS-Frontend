import { useCallback, useState } from "react";
import { useAuth } from "../../context/useAuth.js";
import AdministrativeAssignment from "../../components/horses/AdministrativeAssignment.jsx";
import TrainerAssignment from "../../components/horses/TrainerAssignment.jsx";
import { Link, useParams } from "react-router-dom";
import { getHorse } from "../../services/horseService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { HORSE_GENDERS, PREFERENCES } from "../../constants/registration.js";
import HealthStatus from "../../components/horses/HealthStatus.jsx";
import HorseError from "../../components/horses/HorseError.jsx";
import HorsePhoto from "../../components/horses/HorsePhoto.jsx";
import HorseAssignments from "../../components/horses/HorseAssignments.jsx";

function Fields({ values }) {
    return <dl className="row mb-0">{values.map(([label, value]) => <div className="col-12 col-lg-6" key={label}>
        <dt>{label}</dt><dd>{value === null || value === undefined || value === "" ? "Not provided" : value}</dd>
    </div>)}</dl>;
}
export function HorseProfileContent({ data, assignmentControls }) {
    if (!data?.horse) return <p>No Horse details were returned.</p>;
    const { horse, latestMeasurement, preferences, assignments, currentStall } = data;
    return <>
        <div className="d-flex flex-wrap align-items-center gap-3 mt-3"><h1>{horse.name || "Horse profile"}</h1><HealthStatus value={horse.healthStatus} /></div>
        <section className="mb-3" aria-label="Horse photo"><HorsePhoto key={horse.id} horseId={horse.id} name={horse.name} /></section>
        <section className="border rounded p-3 mb-3"><h2 className="h5">Identity and pedigree</h2>
            <Fields values={[["Horse ID", horse.id], ["Registration number", horse.registrationNumber], ["Breed", horse.breed],
                ["Date of birth", horse.dateOfBirth], ["Gender", HORSE_GENDERS.includes(horse.gender) ? horse.gender : "Unknown gender"],
                ["Sire", horse.sire], ["Dam", horse.dam], ["Owner ID", horse.ownerId]]} />
        </section>
        <section className="border rounded p-3 mb-3"><h2 className="h5">Boarding and current stall</h2>
            <Fields values={[["Boarding start", horse.boardingStart], ["Boarding end", horse.boardingEnd]]} />
            {currentStall ? <Fields values={[["Current stall ID", currentStall.stallId], ["Occupancy recorded", currentStall.createdAt], ["Occupancy ID", currentStall.id]]} />
                : <p>No current stall occupancy returned.</p>}
        </section>
        <section className="border rounded p-3 mb-3"><h2 className="h5">Latest physical measurement</h2>
            {latestMeasurement ? <Fields values={[["Measurement date", latestMeasurement.date], ["Height (cm)", latestMeasurement.heightCm], ["Weight (kg)", latestMeasurement.weightKg]]} />
                : <p>No physical measurement returned.</p>}
        </section>
        <section className="border rounded p-3 mb-3" aria-labelledby="horse-preferences"><h2 id="horse-preferences" className="h5">Owner staff preferences</h2>
            <p>These are preferences from registration, not official assignments. Approval does not automatically assign staff.</p>
            <Fields values={PREFERENCES.map(({ field, label }) => [`${label} ID`, preferences?.[field] || "No preference returned"])} />
        </section>
        <HorseAssignments assignments={assignments} />
        {assignmentControls}
    </>;
}
function LoadedProfile({ initialData, actorRole, user, onReload }) {
    const [updated, setUpdated] = useState(null);
    const data = updated || initialData;
    return <HorseProfileContent data={data} assignmentControls={<>
        <AdministrativeAssignment actorRole={actorRole} data={data} onUpdated={setUpdated} onReload={onReload} />
        <TrainerAssignment user={user} data={data} onUpdated={setUpdated} onReload={onReload} />
    </>} />;
}
export function HorseProfileResult({ resource, actorRole, user }) {
    if (resource.loading) return <p role="status">Loading Horse profile...</p>;
    if (resource.error) return <><HorseError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry Horse profile</button></>;
    return <LoadedProfile initialData={resource.data} actorRole={actorRole} user={user} onReload={resource.reload} />;
}
export default function HorseProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const load = useCallback(() => getHorse(id), [id]);
    const resource = useRegistrationResource(load);
    return <section><Link to="/horses">Back to Horses</Link><HorseProfileResult key={id} resource={resource} actorRole={user?.role} user={user} /></section>;
}
