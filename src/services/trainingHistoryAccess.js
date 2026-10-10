// Training metadata was already authorized by GET plan/session. A profile denial
// must not discard that history or grant current assignments and write access.
export async function trainingHorse(loadHorse, horseId, detail) {
    try {
        return await loadHorse(horseId);
    } catch (error) {
        const archived = error.status === 409 && error.response?.data?.title === 'horse_archived' && detail.horseArchived;
        if ((error.status !== 403 && !archived) || typeof detail.horseName !== 'string' || !detail.horseName.trim()) throw error;
        return { horse: { id: horseId, name: detail.horseName, archived: Boolean(detail.horseArchived) }, assignments: [], historyOnly: true };
    }
}