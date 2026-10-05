
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./CitizenDashboard.css";

function StatCard({ title, count, icon, color }) {
    return (
        <div className="citizen-stat-card">
            <div className={`citizen-stat-icon ${color}`}>{icon}</div>
            <div>
                <p className="citizen-stat-title">{title}</p>
                <h2 className="citizen-stat-count">{count}</h2>
            </div>
        </div>
    );
}

function formatStatus(status) {
    return status
        ?.toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Unknown";
}

function formatCategory(category) {
    return category
        ?.toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Other";
}

function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function CitizenDashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadMyIssues = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/issues/my");

            const data = response.data;
            setIssues(Array.isArray(data) ? data : data?.content || []);
        } catch (err) {
            console.error("Citizen issues loading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your reports. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMyIssues();
    }, [loadMyIssues]);

    const stats = useMemo(() => {
        const count = (status) =>
            issues.filter((issue) => issue.status === status).length;

        return {
            total: issues.length,
            reported: count("REPORTED"),
            verified: count("VERIFIED"),
            assigned: count("ASSIGNED"),
            inProgress: count("IN_PROGRESS"),
            resolved: count("RESOLVED"),
            closed: count("CLOSED"),
        };
    }, [issues]);

    const awaitingAction = stats.reported + stats.verified;
    const inProgressCount = stats.assigned + stats.inProgress;
    const completedCount = stats.resolved + stats.closed;

    const recentIssues = useMemo(() => {
        return [...issues]
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();

                return (Number.isNaN(dateB) ? 0 : dateB) -
                    (Number.isNaN(dateA) ? 0 : dateA);
            })
            .slice(0, 5);
    }, [issues]);

    const openIssues = () => {
        window.location.href = "/issues";
    };

    return (
        <div className="citizen-dashboard">
            <section className="citizen-welcome">
                <div>
                    <span className="citizen-eyebrow">
                        CIVICOS / CITIZEN PORTAL
                    </span>

                    <h1>Your CivicOS Dashboard</h1>

                    <p>
                        Track the infrastructure issues you have reported
                        and follow their progress in your community.
                    </p>
                </div>

                <button
                    className="citizen-primary-button"
                    onClick={openIssues}
                >
                    View My Issues <span aria-hidden="true">→</span>
                </button>
            </section>

            {error && (
                <div className="citizen-error" role="alert">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={loadMyIssues}
                        disabled={loading}
                    >
                        Retry
                    </button>
                </div>
            )}

            <section className="citizen-dashboard-section">
                <div className="citizen-section-heading">
                    <div>
                        <h2>My Issue Overview</h2>
                        <p>
                            A summary of the infrastructure reports
                            you have submitted.
                        </p>
                    </div>

                    <span className="citizen-live-indicator">
                        <span /> My reports
                    </span>
                </div>

                <div className="citizen-stats-grid">
                    <StatCard
                        title="Total Reports"
                        count={loading ? "—" : stats.total}
                        icon="▤"
                        color="blue"
                    />

                    <StatCard
                        title="Awaiting Action"
                        count={loading ? "—" : awaitingAction}
                        icon="◷"
                        color="orange"
                    />

                    <StatCard
                        title="In Progress"
                        count={loading ? "—" : inProgressCount}
                        icon="↻"
                        color="purple"
                    />

                    <StatCard
                        title="Resolved"
                        count={loading ? "—" : completedCount}
                        icon="✓"
                        color="green"
                    />
                </div>
            </section>

            <section className="citizen-content-card">
                <div className="citizen-section-heading">
                    <div>
                        <h2>My Recent Reports</h2>
                        <p>
                            The latest infrastructure issues you submitted.
                        </p>
                    </div>

                    <div className="citizen-report-actions">
                        <button
                            type="button"
                            className="citizen-text-button"
                            onClick={loadMyIssues}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "Refresh ↻"}
                        </button>

                        <button
                            type="button"
                            className="citizen-text-button"
                            onClick={openIssues}
                        >
                            View All →
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="citizen-empty-state">
                        <div className="loading-spinner" />
                        <p>Loading your reports...</p>
                    </div>
                ) : recentIssues.length === 0 ? (
                    <div className="citizen-empty-state">
                        <div className="citizen-empty-icon">▤</div>
                        <h3>No reports yet</h3>
                        <p>
                            When you report an infrastructure issue,
                            its progress will appear here.
                        </p>

                        <button
                            className="citizen-primary-button"
                            onClick={openIssues}
                        >
                            View Issues →
                        </button>
                    </div>
                ) : (
                    <div className="citizen-issue-list">
                        {recentIssues.map((issue) => (
                            <article
                                className="citizen-issue-row"
                                key={issue.id}
                            >
                                <div className="citizen-issue-main">
                                    <div className="citizen-issue-title-line">
                                        <h3>{issue.title || "Untitled issue"}</h3>

                                        <span
                                            className={`citizen-status status-${String(
                                                issue.status || "unknown"
                                            ).toLowerCase().replaceAll("_", "-")}`}
                                        >
                                            {formatStatus(issue.status)}
                                        </span>
                                    </div>

                                    <p className="citizen-issue-description">
                                        {issue.description ||
                                            "No description provided."}
                                    </p>

                                    <div className="citizen-issue-meta">
                                        <span>
                                            {formatCategory(issue.category)}
                                        </span>

                                        <span className="citizen-meta-dot">
                                            •
                                        </span>

                                        <span
                                            className={`citizen-priority priority-${String(
                                                issue.priority || "unknown"
                                            ).toLowerCase()}`}
                                        >
                                            {formatStatus(issue.priority)} Priority
                                        </span>

                                        <span className="citizen-meta-dot">
                                            •
                                        </span>

                                        <span>
                                            Reported {formatDate(issue.createdAt)}
                                        </span>
                                    </div>

                                    {issue.assignedToName && (
                                        <p className="citizen-assigned">
                                            Assigned to:{" "}
                                            <strong>
                                                {issue.assignedToName}
                                            </strong>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="citizen-view-button"
                                    onClick={openIssues}
                                    title="Open your issue list to view details"
                                >
                                    View Issues
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="citizen-help-card">
                <div className="citizen-help-symbol">i</div>

                <div>
                    <h3>Understanding your issue status</h3>
                    <p>
                        Your report may move through reported, verified,
                        assigned, in progress, and resolved stages.
                        Open your issue list to review your reports.
                    </p>
                </div>
            </section>
        </div>
    );
}