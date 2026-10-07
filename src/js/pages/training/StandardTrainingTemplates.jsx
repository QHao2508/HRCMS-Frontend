import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Pencil,
    Archive,
    X,
} from "lucide-react";

import TrainingLayout from "../../components/training/TrainingLayout";
import {
    getTrainingTemplates,
    createTrainingTemplate,
    updateTrainingTemplate,
    archiveTrainingTemplate,
} from "../../services/trainingService";


const emptyForm = {
    name: "",
    goal: "",
    phase: "",
    distanceMetres: "",
    intensity: "Moderate",
    surface: "",
    frequencyPerWeek: 1,
    notes: "",
};


function StandardTrainingTemplates() {

    const [templates, setTemplates] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [editingTemplate, setEditingTemplate] = useState(null);

    const [form, setForm] = useState(emptyForm);


    // =========================================
    // LOAD TEMPLATES
    // =========================================

    const loadTemplates = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getTrainingTemplates(1, 50);

            /*
             * Backend response shape is not explicitly described
             * in OpenAPI, so support common paginated shapes.
             */

            const list =
                Array.isArray(data)
                    ? data
                    : data?.items ??
                    data?.data ??
                    data?.results ??
                    [];

            setTemplates(list);

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to load training templates."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadTemplates();
    }, []);


    // =========================================
    // FORM
    // =========================================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    const openCreateModal = () => {

        setEditingTemplate(null);

        setForm(emptyForm);

        setError("");

        setShowModal(true);
    };


    const openEditModal = (template) => {

        setEditingTemplate(template);

        setForm({
            name: template.name ?? "",
            goal: template.goal ?? "",
            phase: template.phase ?? "",
            distanceMetres: template.distanceMetres ?? "",
            intensity: template.intensity ?? "Moderate",
            surface: template.surface ?? "",
            frequencyPerWeek:
                template.frequencyPerWeek ?? 1,
            notes: template.notes ?? "",
        });

        setError("");

        setShowModal(true);
    };


    const closeModal = () => {

        if (saving) {
            return;
        }

        setShowModal(false);

        setEditingTemplate(null);

        setForm(emptyForm);
    };


    // =========================================
    // SAVE
    // =========================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            setSaving(true);
            setError("");

            const payload = {
                name: form.name.trim(),
                goal: form.goal.trim(),
                phase: form.phase.trim(),
                distanceMetres:
                    Number(form.distanceMetres),
                intensity: form.intensity,
                surface: form.surface.trim(),
                frequencyPerWeek:
                    Number(form.frequencyPerWeek),
                notes: form.notes.trim(),
            };


            if (editingTemplate) {

                await updateTrainingTemplate(
                    editingTemplate.id,
                    payload
                );

            } else {

                await createTrainingTemplate(payload);

            }


            closeModal();

            await loadTemplates();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to save training template."
            );

        } finally {

            setSaving(false);

        }
    };


    // =========================================
    // ARCHIVE
    // =========================================

    const handleArchive = async (template) => {

        const confirmed = window.confirm(
            `Archive "${template.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");

            await archiveTrainingTemplate(template.id);

            await loadTemplates();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to archive training template."
            );
        }
    };


    // =========================================
    // SEARCH
    // =========================================

    const filteredTemplates = templates.filter(
        (template) => {

            const keyword =
                search.toLowerCase();

            return (
                template.name
                    ?.toLowerCase()
                    .includes(keyword) ||

                template.goal
                    ?.toLowerCase()
                    .includes(keyword) ||

                template.phase
                    ?.toLowerCase()
                    .includes(keyword)
            );
        }
    );


    return (
        <TrainingLayout>

            <div className="training-page">

                {/* =====================================
                    PAGE HEADER
                ====================================== */}

                <div className="training-page-header">

                    <div>

                        <div className="training-breadcrumb">
                            Training / Standard Training Templates
                        </div>

                        <h1>
                            Standard Training Templates
                        </h1>

                        <p>
                            Manage standard training frameworks
                            used by Trainers when creating
                            Training Plans.
                        </p>

                    </div>


                    <button
                        className="training-primary-button"
                        onClick={openCreateModal}
                    >
                        <Plus size={16} />

                        Create Template
                    </button>

                </div>


                {/* =====================================
                    ERROR
                ====================================== */}

                {error && (
                    <div className="training-error">
                        {error}
                    </div>
                )}


                {/* =====================================
                    TOOLBAR
                ====================================== */}

                <div className="training-toolbar">

                    <div className="training-search">

                        <Search size={16} />

                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>


                {/* =====================================
                    TABLE
                ====================================== */}

                <div className="training-card">

                    {loading ? (

                        <div className="training-loading">
                            Loading training templates...
                        </div>

                    ) : filteredTemplates.length === 0 ? (

                        <div className="training-empty">

                            <h3>
                                No training templates found
                            </h3>

                            <p>
                                Create your first Standard
                                Training Template.
                            </p>

                            <button
                                className="training-primary-button"
                                onClick={openCreateModal}
                            >
                                <Plus size={15} />

                                Create Template
                            </button>

                        </div>

                    ) : (

                        <div className="training-table-wrapper">

                            <table className="training-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Template Name
                                        </th>

                                        <th>
                                            Training Goal
                                        </th>

                                        <th>
                                            Phase
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Last Updated
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredTemplates.map(
                                        (template) => (

                                            <tr
                                                key={
                                                    template.id
                                                }
                                            >

                                                <td>

                                                    <strong>
                                                        {
                                                            template.name
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        template.goal
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        template.phase
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            `training-status ${template.archived
                                                                ? "archived"
                                                                : "active"
                                                            }`
                                                        }
                                                    >
                                                        {
                                                            template.archived
                                                                ? "ARCHIVED"
                                                                : "ACTIVE"
                                                        }
                                                    </span>

                                                </td>


                                                <td>
                                                    {template.updatedAt
                                                        ? new Date(
                                                            template.updatedAt
                                                        ).toLocaleDateString()
                                                        : "—"}
                                                </td>


                                                <td>

                                                    <div className="training-actions">

                                                        <button
                                                            className="training-icon-button"
                                                            title="Edit"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    template
                                                                )
                                                            }
                                                        >
                                                            <Pencil
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                        </button>


                                                        {!template.archived && (
                                                            <button
                                                                className="training-icon-button danger"
                                                                title="Archive"
                                                                onClick={() =>
                                                                    handleArchive(
                                                                        template
                                                                    )
                                                                }
                                                            >
                                                                <Archive
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            </button>
                                                        )}

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>


            {/* =========================================
                CREATE / EDIT MODAL
            ========================================== */}

            {showModal && (

                <div className="training-modal-overlay">

                    <div className="training-modal">

                        <div className="training-modal-header">

                            <div>

                                <h2>
                                    {editingTemplate
                                        ? "Edit Training Template"
                                        : "Create Training Template"}
                                </h2>

                                <p>
                                    Standard training framework
                                    managed by Head Trainer.
                                </p>

                            </div>


                            <button
                                className="training-modal-close"
                                onClick={closeModal}
                            >
                                <X size={18} />
                            </button>

                        </div>


                        <form
                            onSubmit={handleSubmit}
                            className="training-form"
                        >

                            <div className="training-form-grid">

                                {/* Name */}
                                <div className="training-form-group full">

                                    <label>
                                        Template Name
                                    </label>

                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        maxLength={200}
                                        placeholder="e.g. Aerobic Base Conditioning"
                                    />

                                </div>


                                {/* Goal */}
                                <div className="training-form-group">

                                    <label>
                                        Training Goal
                                    </label>

                                    <input
                                        name="goal"
                                        value={form.goal}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Build aerobic endurance"
                                    />

                                </div>


                                {/* Phase */}
                                <div className="training-form-group">

                                    <label>
                                        Phase
                                    </label>

                                    <input
                                        name="phase"
                                        value={form.phase}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Foundation"
                                    />

                                </div>


                                {/* Distance */}
                                <div className="training-form-group">

                                    <label>
                                        Typical Distance (metres)
                                    </label>

                                    <input
                                        type="number"
                                        name="distanceMetres"
                                        value={
                                            form.distanceMetres
                                        }
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        max="100000"
                                        step="0.01"
                                    />

                                </div>


                                {/* Intensity */}
                                <div className="training-form-group">

                                    <label>
                                        Typical Intensity
                                    </label>

                                    <select
                                        name="intensity"
                                        value={
                                            form.intensity
                                        }
                                        onChange={handleChange}
                                        required
                                    >

                                        <option value="Light">
                                            Light
                                        </option>

                                        <option value="Moderate">
                                            Moderate
                                        </option>

                                        <option value="Heavy">
                                            Heavy
                                        </option>

                                    </select>

                                </div>


                                {/* Surface */}
                                <div className="training-form-group">

                                    <label>
                                        Surface
                                    </label>

                                    <input
                                        name="surface"
                                        value={form.surface}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Turf"
                                    />

                                </div>


                                {/* Frequency */}
                                <div className="training-form-group">

                                    <label>
                                        Recommended Frequency
                                    </label>

                                    <input
                                        type="number"
                                        name="frequencyPerWeek"
                                        value={
                                            form.frequencyPerWeek
                                        }
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        max="21"
                                    />

                                    <span className="training-field-hint">
                                        sessions / week
                                    </span>

                                </div>


                                {/* Notes */}
                                <div className="training-form-group full">

                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder="Training template notes..."
                                    />

                                </div>

                            </div>


                            <div className="training-form-actions">

                                <button
                                    type="button"
                                    className="training-secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="training-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingTemplate
                                            ? "Save Changes"
                                            : "Create Template"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </TrainingLayout>
    );
}

export default StandardTrainingTemplates;