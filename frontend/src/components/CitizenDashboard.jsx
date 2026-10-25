
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
    formatLocaleDate,
    translateStatus,
    useLocale,
} from "../i18n/LocaleContext";
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

function formatStatus(status, locale) {
    return translateStatus(locale, status);
}

function formatCategory(category, locale) {
    if (locale === "hi" && category) {
        return translateStatus(locale, category);
    }
    return category
        ?.toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Other";
}

function formatDate(dateValue, locale) {
    return formatLocaleDate(dateValue, locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function CitizenDashboard() {
    const { locale, t } = useLocale();
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
                t("Unable to load your reports. Please try again.")
            );
        } finally {
            setLoading(false);
        }
    }, [t]);

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

                    <h1>{t("Your CivicOS Dashboard")}</h1>

                    <p>
                        {t("Track the infrastructure issues you have reported and follow their progress in your community.")}
                    </p>
                </div>

                <button
                    className="citizen-primary-button"
                    onClick={openIssues}
                >
                    {t("View My Issues")} <span aria-hidden="true">→</span>
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
                        {t("Retry")}
                    </button>
                </div>
            )}

            <section className="citizen-dashboard-section">
                <div className="citizen-section-heading">
                    <div>
                        <h2>{t("My Issue Overview")}</h2>
                        <p>
                            {t("A summary of the infrastructure reports you have submitted.")}
                        </p>
                    </div>

                    <span className="citizen-live-indicator">
                        <span /> {t("My reports")}
                    </span>
                </div>

                <div className="citizen-stats-grid">
                    <StatCard
                        title={t("Total Reports")}
                        count={loading ? "—" : stats.total}
                        icon="▤"
                        color="blue"
                    />

                    <StatCard
                        title={t("Awaiting Action")}
                        count={loading ? "—" : awaitingAction}
                        icon="◷"
                        color="orange"
                    />

                    <StatCard
                        title={t("In Progress")}
                        count={loading ? "—" : inProgressCount}
                        icon="↻"
                        color="purple"
                    />

                    <StatCard
                        title={t("Resolved")}
                        count={loading ? "—" : completedCount}
                        icon="✓"
                        color="green"
                    />
                </div>
            </section>

            <section className="citizen-content-card">
                <div className="citizen-section-heading">
                    <div>
                        <h2>{t("My Recent Reports")}</h2>
                        <p>
                            {t("The latest infrastructure issues you submitted.")}
                        </p>
                    </div>

                    <div className="citizen-report-actions">
                        <button
                            type="button"
                            className="citizen-text-button"
                            onClick={loadMyIssues}
                            disabled={loading}
                        >
                            {loading ? t("Refreshing...") : t("Refresh ↻")}
                        </button>

                        <button
                            type="button"
                            className="citizen-text-button"
                            onClick={openIssues}
                        >
                            {t("View All →")}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="citizen-empty-state">
                        <div className="loading-spinner" />
                        <p>{t("Loading your reports...")}</p>
                    </div>
                ) : recentIssues.length === 0 ? (
                    <div className="citizen-empty-state">
                        <div className="citizen-empty-icon">▤</div>
                        <h3>{t("No reports yet")}</h3>
                        <p>
                            {t("When you report an infrastructure issue, its progress will appear here.")}
                        </p>

                        <button
                            className="citizen-primary-button"
                            onClick={openIssues}
                        >
                            {t("View Issues →")}
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
                                        <h3>
                                            {issue.title || t("Untitled issue")}
                                        </h3>

                                        <span
                                            className={`citizen-status status-${String(
                                                issue.status || "unknown"
                                            ).toLowerCase().replaceAll("_", "-")}`}
                                        >
                                            {formatStatus(issue.status, locale)}
                                        </span>
                                    </div>

                                    <p className="citizen-issue-description">
                                        {issue.description ||
                                            t("No description provided.")}
                                    </p>

                                    <div className="citizen-issue-meta">
                                        <span>
                                            {formatCategory(issue.category, locale)}
                                        </span>

                                        <span className="citizen-meta-dot">
                                            •
                                        </span>

                                        <span
                                            className={`citizen-priority priority-${String(
                                                issue.priority || "unknown"
                                            ).toLowerCase()}`}
                                        >
                                            {formatStatus(issue.priority, locale)}{" "}
                                            {t("Priority")}
                                        </span>

                                        <span className="citizen-meta-dot">
                                            •
                                        </span>

                                        <span>
                                            {t("Reported")}{" "}
                                            {formatDate(issue.createdAt, locale)}
                                        </span>
                                    </div>

                                    {issue.assignedToName && (
                                        <p className="citizen-assigned">
                                            {t("Assigned to:")}{" "}
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
                                    title={t("Open your issue list to view details")}
                                >
                                    {t("View Issues")}
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="citizen-help-card">
                <div className="citizen-help-symbol">i</div>

                <div>
                    <h3>{t("Understanding your issue status")}</h3>
                    <p>
                        {t("Your report may move through reported, verified, assigned, in progress, and resolved stages. Open your issue list to review your reports.")}
                    </p>
                </div>
            </section>
        </div>
    );
}