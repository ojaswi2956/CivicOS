import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
    formatLocaleDate,
    translateStatus,
    useLocale,
} from "../i18n/LocaleContext";
import IssueMap from "../components/LazyIssueMap";

function StatCard({ title, value, description, accent, featured = false }) {
    const { t } = useLocale();
    return (
        <div
            className={`admin-stat-card${featured ? " admin-stat-card-featured" : ""}`}
        >
            <div className="stat-card-top">
                <span
                    className="stat-accent"
                    style={{
                        background: featured
                            ? "rgba(255, 255, 255, 0.8)"
                            : accent,
                    }}
                />
                <span className="stat-label">{t(title)}</span>
            </div>
            <strong className="stat-value">{value ?? 0}</strong>
            <span className="stat-description">{t(description)}</span>
        </div>
    );
}

function PriorityCard({ title, value, total, accent }) {
    const { locale } = useLocale();
    const percentage =
        total > 0 ? Math.round((Number(value || 0) / total) * 100) : 0;

    return (
        <div className="priority-card">
            <div className="priority-card-heading">
                <span className="priority-dot" style={{ background: accent }} />
                <span>{translateStatus(locale, title)}</span>
                <strong>{value ?? 0}</strong>
            </div>

            <div className="priority-track">
                <div
                    className="priority-fill"
                    style={{ width: `${percentage}%`, background: accent }}
                />
            </div>

            <small>
                {locale === "hi"
                    ? `${percentage}% कुल समस्याओं में से`
                    : `${percentage}% of all issues`}
            </small>
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
    return (
        category
            ?.toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
        (locale === "hi" ? "अन्य" : "Other")
    );
}

function formatDate(dateValue, locale) {
    return formatLocaleDate(dateValue, locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function SeverityBadge({ value }) {
    const { locale } = useLocale();
    const severity = String(value || "unknown")
        .toLowerCase()
        .replaceAll("_", "-");

    return (
        <span className={`analytics-badge severity-${severity}`}>
            {formatStatus(value, locale)}
        </span>
    );
}

function SectionHeading({ title, description, action }) {
    const { t } = useLocale();
    return (
        <div className="section-heading">
            <div>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
            </div>
            {action}
        </div>
    );
}

function AnalyticsError({ message, onRetry }) {
    const { t } = useLocale();
    if (!message) return null;

    return (
        <div className="dashboard-error">
            <span>{t(message)}</span>
            {onRetry && (
                <button type="button" onClick={onRetry}>
                    {t("Retry")}
                </button>
            )}
        </div>
    );
}

function AdminRecentIssues({
    issues,
    loading,
    error,
    onRetry,
    onOpenIssues,
}) {
    const { locale, t } = useLocale();

    return (
        <section className="dashboard-panel admin-recent-panel">
            <SectionHeading
                title="Recent Issues"
                description="The latest infrastructure issues reported by residents."
                action={
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onOpenIssues}
                    >
                        {t("View All →")}
                    </button>
                }
            />

            {error ? (
                <div className="dashboard-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={onRetry}>
                        {t("Retry")}
                    </button>
                </div>
            ) : loading ? (
                <p className="analytics-message">
                    {t("Loading recent issues...")}
                </p>
            ) : issues.length === 0 ? (
                <p className="analytics-message">{t("No issues found.")}</p>
            ) : (
                <div className="admin-recent-table-wrap">
                    <table className="admin-recent-table">
                        <thead>
                            <tr>
                                <th scope="col">{t("Issue")}</th>
                                <th scope="col">{t("Category")}</th>
                                <th scope="col">{t("Priority")}</th>
                                <th scope="col">{t("Status")}</th>
                                <th scope="col">{t("Assigned Officer")}</th>
                                <th scope="col">{t("Reported")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.map((issue) => (
                                <tr key={issue.id}>
                                    <td>
                                        <strong>{issue.title || t("Untitled issue")}</strong>
                                        <small>#{issue.id}</small>
                                    </td>
                                    <td>{formatCategory(issue.category, locale)}</td>
                                    <td>
                                        <span
                                            className={`priority-badge priority-${String(
                                                issue.priority || ""
                                            ).toLowerCase()}`}
                                        >
                                            {formatStatus(issue.priority, locale)}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`status-badge status-${String(
                                                issue.status || ""
                                            ).toLowerCase()}`}
                                        >
                                            {formatStatus(issue.status, locale)}
                                        </span>
                                    </td>
                                    <td>
                                        {issue.assignedToName || t("Unassigned")}
                                    </td>
                                    <td>{formatDate(issue.createdAt, locale)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function DepartmentStatusSummary({
    departments,
    loading,
    error,
    onRetry,
}) {
    const { t } = useLocale();
    const statusColumns = [
        { key: "reported", label: "Reported" },
        { key: "verified", label: "Verified" },
        { key: "assigned", label: "Assigned" },
        { key: "inProgress", label: "In Progress" },
        { key: "resolved", label: "Resolved" },
        { key: "closed", label: "Closed" },
    ];

    return (
        <section className="dashboard-panel admin-recent-panel">
            <SectionHeading
                title="Department Status Summary"
                description="Assigned issues grouped by department and current status."
            />

            {error ? (
                <div className="dashboard-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={onRetry}>
                        {t("Retry")}
                    </button>
                </div>
            ) : loading ? (
                <p className="analytics-message">
                    {t("Loading department issue summary...")}
                </p>
            ) : departments.length === 0 ? (
                <p className="analytics-message">
                    {t("No department issue data available.")}
                </p>
            ) : (
                <div className="admin-recent-table-wrap">
                    <table className="admin-recent-table admin-department-table">
                        <thead>
                            <tr>
                                <th scope="col">{t("Department")}</th>
                                {statusColumns.map((column) => (
                                    <th scope="col" key={column.key}>
                                        {t(column.label)}
                                    </th>
                                ))}
                                <th scope="col">{t("Total")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((department) => (
                                <tr key={department.departmentId}>
                                    <td>
                                        <strong>{department.departmentName}</strong>
                                    </td>
                                    {statusColumns.map((column) => (
                                        <td key={column.key}>
                                            {department[column.key] ?? 0}
                                        </td>
                                    ))}
                                    <td>
                                        <strong>{department.totalIssues ?? 0}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function DashboardAttentionPanel({
    attention,
    loading,
    error,
    priorityIssues,
    priorityLoading,
    priorityError,
    onRetry,
    onOpenIssues,
    role,
}) {
    const { locale, t } = useLocale();
    const [expandedIssueId, setExpandedIssueId] = useState(null);
    const priorityIssueIds = new Set(
        priorityIssues.map((issue) => issue.id)
    );
    const attentionIssueIds = new Set(
        (attention?.issues || []).map(({ issue }) => issue.id)
    );
    const displayIssues = [
        ...(attention?.issues || []).map((item) => ({
            ...item,
            highPriority: priorityIssueIds.has(item.issue.id),
        })),
        ...priorityIssues
            .filter((issue) => !attentionIssueIds.has(issue.id))
            .map((issue) => ({
                issue,
                overdue: false,
                unassigned: false,
                highPriority: true,
            })),
    ];
    const highPriorityCount = priorityIssues.length;

    return (
        <section className="dashboard-panel attention-panel">
            <SectionHeading
                title="Needs attention"
                description="Open issues older than 7 days or verified issues awaiting assignment."
                action={
                    <div className="attention-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onRetry}
                            disabled={loading}
                            aria-label={t("Refresh attention items")}
                        >
                            {loading ? t("Refreshing...") : t("Refresh")}
                        </button>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onOpenIssues}
                        >
                            {t("Review issues")} →
                        </button>
                    </div>
                }
            />

            <div
                className={`attention-summary${role === "ADMIN" ? " attention-summary-admin" : ""}`}
            >
                <div className="attention-summary-item overdue">
                    <span>{t("Overdue over 7 days")}</span>
                    <strong>{loading ? "—" : attention?.overdueCount ?? 0}</strong>
                </div>
                {role === "ADMIN" && (
                    <>
                        <div className="attention-summary-item unassigned">
                            <span>{t("Awaiting assignment")}</span>
                            <strong>
                                {loading ? "—" : attention?.unassignedCount ?? 0}
                            </strong>
                        </div>
                        <div className="attention-summary-item high-priority">
                            <span>{t("High-priority issues shown")}</span>
                            <strong>
                                {priorityLoading ? "—" : highPriorityCount}
                            </strong>
                        </div>
                    </>
                )}
            </div>

            {role === "ADMIN" && priorityError && (
                <div className="dashboard-error" role="alert">
                    <span>{priorityError}</span>
                    <button type="button" onClick={onRetry}>
                        {t("Retry")}
                    </button>
                </div>
            )}

            {error ? (
                <div className="dashboard-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={onRetry}>
                        {t("Retry")}
                    </button>
                </div>
            ) : loading && priorityLoading ? (
                <p className="analytics-message">
                    {t("Loading attention items...")}
                </p>
            ) : displayIssues.length ? (
                <ul className="attention-issue-list">
                    {displayIssues.map(({ issue, overdue, unassigned, highPriority }) => (
                        <li className="attention-issue-item" key={issue.id}>
                            <div className="attention-issue-row">
                                <div className="attention-issue-main">
                                    <strong>{issue.title || t("Untitled issue")}</strong>
                                    <span>
                                        #{issue.id} · {translateStatus(locale, issue.status)}
                                        {" · "}
                                        {formatDate(issue.createdAt, locale)}
                                    </span>
                                </div>
                                <div className="attention-issue-tags">
                                    {overdue && (
                                        <span className="attention-tag overdue">
                                            {t("Overdue over 7 days")}
                                        </span>
                                    )}
                                    {unassigned && (
                                        <span className="attention-tag unassigned">
                                            {t("Awaiting assignment")}
                                        </span>
                                    )}
                                    {highPriority && (
                                        <span className="attention-tag high-priority">
                                            {translateStatus(locale, issue.priority)}{" "}
                                            {t("Priority")}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        className="attention-details-toggle"
                                        aria-expanded={expandedIssueId === issue.id}
                                        onClick={() =>
                                            setExpandedIssueId((current) =>
                                                current === issue.id ? null : issue.id
                                            )
                                        }
                                    >
                                        {expandedIssueId === issue.id
                                            ? t("Hide details")
                                            : t("View details")}
                                    </button>
                                </div>
                            </div>
                            {expandedIssueId === issue.id && (
                                <div className="attention-issue-details">
                                    <p>
                                        <strong>{t("Category")}:</strong>{" "}
                                        {translateStatus(locale, issue.category)}
                                    </p>
                                    {issue.description && (
                                        <p>
                                            <strong>{t("Description")}:</strong>{" "}
                                            {issue.description}
                                        </p>
                                    )}
                                    {issue.assignedToName && (
                                        <p>
                                            <strong>{t("Assigned Officer")}:</strong>{" "}
                                            {issue.assignedToName}
                                        </p>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="attention-empty">
                    {t("No issues need attention right now.")}
                </p>
            )}
        </section>
    );
}

/* CIVIC RISK RADAR */

function CivicRiskPanel({ risks, loading, error, onRetry }) {
    const { t } = useLocale();
    const criticalCount = risks.filter(
        (risk) => risk.riskLevel === "CRITICAL"
    ).length;

    const highCount = risks.filter(
        (risk) => risk.riskLevel === "HIGH"
    ).length;

    const moderateCount = risks.filter(
        (risk) => risk.riskLevel === "MODERATE"
    ).length;

    return (
        <section className="dashboard-panel analytics-panel">
            <SectionHeading
                title="Civic Risk Radar"
                description="Issues ranked by their estimated civic risk."
                action={
                    <span className="live-indicator">
                        <span /> {t("Risk analysis")}
                    </span>
                }
            />

            <AnalyticsError message={error} onRetry={onRetry} />

            {!error && loading ? (
                <p className="analytics-message">
                    {t("Loading risk analysis...")}
                </p>
            ) : !error && risks.length === 0 ? (
                <p className="analytics-message">
                    {t("No risk records are available.")}
                </p>
            ) : (
                !error && (
                    <>
                        <div className="analytics-mini-stats">
                            <div className="analytics-mini-stat">
                                <span>{t("Critical risk")}</span>
                                <strong>{criticalCount}</strong>
                            </div>
                            <div className="analytics-mini-stat">
                                <span>{t("High risk")}</span>
                                <strong>{highCount}</strong>
                            </div>
                            <div className="analytics-mini-stat">
                                <span>{t("Moderate risk")}</span>
                                <strong>{moderateCount}</strong>
                            </div>
                            <div className="analytics-mini-stat">
                                <span>{t("Issues assessed")}</span>
                                <strong>{risks.length}</strong>
                            </div>
                        </div>

                        <div className="analytics-list">
                            {risks.slice(0, 8).map((risk) => (
                                <article
                                    className="analytics-list-item"
                                    key={risk.issueId}
                                >
                                    <div className="analytics-item-main">
                                        <strong>
                                            {risk.title ||
                                                t("Issue #{id}").replace(
                                                    "{id}",
                                                    risk.issueId
                                                )}
                                        </strong>

                                        <span>
                                            {t("Issue #{id} · {days} days old")
                                                .replace("{id}", risk.issueId)
                                                .replace(
                                                    "{days}",
                                                    risk.issueAgeDays ?? 0
                                                )}
                                        </span>

                                        <span>
                                            {t("Nearby related issues:")}{" "}
                                            {risk.nearbyRelatedIssues ?? 0}
                                        </span>

                                        {Array.isArray(risk.riskFactors) &&
                                            risk.riskFactors.length > 0 && (
                                                <small>
                                                    {risk.riskFactors.join(" · ")}
                                                </small>
                                            )}
                                    </div>

                                    <div className="analytics-item-score">
                                        <strong>{risk.riskScore ?? 0}</strong>
                                        <SeverityBadge value={risk.riskLevel} />
                                    </div>
                                </article>
                            ))}
                        </div>

                        {risks.length > 8 && (
                            <p className="analytics-footnote">
                                {t(
                                    "Showing the 8 highest-priority records out of {count} assessed issues."
                                ).replace("{count}", risks.length)}
                            </p>
                        )}
                    </>
                )
            )}
        </section>
    );
}

/* CIVIC TRUST SCORE */

function CivicTrustPanel({
    trustScores,
    loading,
    error,
    onRetry,
    role,
}) {
    const { locale, t } = useLocale();
    const scores = Array.isArray(trustScores)
        ? trustScores
        : trustScores
          ? [trustScores]
          : [];

    return (
        <section className="dashboard-panel analytics-panel">
            <SectionHeading
                title="Civic Trust Score"
                description={
                    role === "ADMIN"
                        ? "Compare department performance and resolution outcomes."
                        : "Your department's service performance indicators."
                }
            />

            <AnalyticsError message={error} onRetry={onRetry} />

            {!error && loading ? (
                <p className="analytics-message">
                    {t("Loading trust scores...")}
                </p>
            ) : !error && scores.length === 0 ? (
                <p className="analytics-message">
                    {t("No trust-score records are available.")}
                </p>
            ) : (
                !error && (
                    <div className="trust-score-list">
                        {scores.map((score, index) => {
                            const trustValue = Math.max(
                                0,
                                Math.min(100, Number(score.trustScore || 0))
                            );

                            return (
                                <article
                                    className="trust-score-card"
                                    key={score.departmentId ?? index}
                                >
                                    <div className="trust-score-heading">
                                        <div>
                                            <strong>
                                                {score.departmentName ||
                                                    t("Your Department")}
                                            </strong>
                                            <span>
                                                {score.trustLevel
                                                    ? translateStatus(
                                                          locale,
                                                          score.trustLevel
                                                      )
                                                    : t("Trust score")}
                                            </span>
                                        </div>

                                        <div className="trust-score-number">
                                            <strong>{trustValue}</strong>
                                            <small>/ 100</small>
                                        </div>
                                    </div>

                                    <div
                                        className="completion-track"
                                        role="progressbar"
                                        aria-label={t(
                                            "Department trust score"
                                        )}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={trustValue}
                                    >
                                        <div
                                            className="completion-fill"
                                            style={{ width: `${trustValue}%` }}
                                        />
                                    </div>

                                    <div className="trust-metrics-grid">
                                        <div>
                                            <span>{t("Resolution rate")}</span>
                                            <strong>
                                                {Number(
                                                    score.resolutionRate || 0
                                                ).toFixed(1)}
                                                %
                                            </strong>
                                        </div>

                                        <div>
                                            <span>{t("Resolved")}</span>
                                            <strong>
                                                {score.resolvedIssues ?? 0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>{t("Unresolved")}</span>
                                            <strong>
                                                {score.unresolvedIssues ?? 0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>{t("Assigned total")}</span>
                                            <strong>
                                                {score.totalAssignedIssues ?? 0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>{t("Average resolution")}</span>
                                            <strong>
                                                {Number(
                                                    score.averageResolutionDays || 0
                                                ).toFixed(1)}{" "}
                                                {locale === "hi" ? " दिन" : " days"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>{t("History coverage")}</span>
                                            <strong>
                                                {Number(
                                                    score.statusHistoryCoverage || 0
                                                ).toFixed(1)}
                                                %
                                            </strong>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )
            )}
        </section>
    );
}

/* CIVIC HOTSPOT PREDICTION */

function CivicHotspotsPanel({ hotspots, loading, error, onRetry }) {
    const { locale, t } = useLocale();
    return (
        <section className="dashboard-panel analytics-panel">
            <SectionHeading
                title="Civic Hotspot Prediction"
                description="Locations with clusters of reported infrastructure issues."
                action={
                    <span className="live-indicator">
                        <span /> {t("Hotspot analysis")}
                    </span>
                }
            />

            <AnalyticsError message={error} onRetry={onRetry} />

            {!error && loading ? (
                <p className="analytics-message">
                    {t("Loading hotspot predictions...")}
                </p>
            ) : !error && hotspots.length === 0 ? (
                <p className="analytics-message">
                    {t("No hotspots are currently identified. More reports with location data may be needed.")}
                </p>
            ) : (
                !error && (
                    <div className="hotspot-grid">
                        {hotspots.slice(0, 8).map((hotspot, index) => {
                            const latitude = Number(hotspot.latitude);
                            const longitude = Number(hotspot.longitude);
                            const hasCoordinates =
                                Number.isFinite(latitude) &&
                                Number.isFinite(longitude);

                            const mapUrl = hasCoordinates
                                ? `https://www.google.com/maps?q=${latitude},${longitude}`
                                : null;

                            return (
                                <article
                                    className="hotspot-card"
                                    key={`${hotspot.latitude}-${hotspot.longitude}-${index}`}
                                >
                                    <div className="hotspot-card-top">
                                                <span className="hotspot-number">
                                                    {locale === "hi"
                                                        ? `समस्या क्षेत्र ${index + 1}`
                                                        : `Hotspot ${index + 1}`}
                                        </span>
                                        <SeverityBadge value={hotspot.severity} />
                                    </div>

                                    <div className="hotspot-score">
                                        <strong>
                                            {hotspot.hotspotScore ?? 0}
                                        </strong>
                                        <span>
                                            {locale === "hi"
                                                ? "/ 100 स्कोर"
                                                : "/ 100 score"}
                                        </span>
                                    </div>

                                    <h4>
                                        {formatCategory(
                                            hotspot.dominantCategory,
                                            locale
                                        )}
                                    </h4>

                                    <div className="hotspot-metrics">
                                        <div>
                                            <span>{t("Total reports")}</span>
                                            <strong>
                                                {hotspot.totalReports ?? 0}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>{t("Recent reports")}</span>
                                            <strong>
                                                {hotspot.recentReports ?? 0}
                                            </strong>
                                        </div>
                                    </div>

                                    <p className="hotspot-coordinates">
                                        {hasCoordinates
                                            ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                                            : t("Location coordinates unavailable")}
                                    </p>

                                    {mapUrl && (
                                        <a
                                            className="hotspot-map-link"
                                            href={mapUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {t("View on map ↗")}
                                        </a>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )
            )}
        </section>
    );
}

/* CITIZEN DASHBOARD */

function CitizenDashboard({ openIssues }) {
    const { locale, t } = useLocale();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mapIssues, setMapIssues] = useState([]);
    const [mapIssueTotal, setMapIssueTotal] = useState(0);
    const [mapPage, setMapPage] = useState(0);
    const [mapPages, setMapPages] = useState(0);
    const [mapLoading, setMapLoading] = useState(true);
    const [mapError, setMapError] = useState("");

    const loadMyIssues = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/issues/my");
            setIssues(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Citizen issues loading error:", err);
            setError(
                err.response?.data?.message ||
                    t("Unable to load your reports. Please try again.")
            );
        } finally {
            setLoading(false);
        }
    };

    const loadMapIssues = useCallback(async () => {
        try {
            const response = await api.get("/issues/map", {
                params: { page: mapPage },
            });
            const data = response.data;
            const items = Array.isArray(data?.content) ? data.content : [];

            setMapIssues(items);
            setMapIssueTotal(Number(data?.totalElements ?? items.length));
            setMapPages(Number(data?.totalPages ?? 0));
        } catch (err) {
            console.error("Community issue map loading error:", err);
            setMapError(
                err.response?.data?.message ||
                    t("Unable to load community issue locations.")
            );
        } finally {
            setMapLoading(false);
        }
    }, [mapPage, t]);

    const refreshMapIssues = () => {
        setMapLoading(true);
        setMapError("");
        loadMapIssues();
    };

    const changeMapPage = (nextPage) => {
        setMapLoading(true);
        setMapPage(nextPage);
    };

    useEffect(() => {
        loadMyIssues();
    }, []);

    useEffect(() => {
        loadMapIssues();
    }, [loadMapIssues]);

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
    const feedbackDueCount = issues.filter(
        (issue) =>
            issue.status === "RESOLVED" &&
            (!issue.feedbackSubmittedAt ||
                issue.reopenRequestStatus === "DECLINED")
    ).length;
    const pendingReopenCount = issues.filter(
        (issue) => issue.reopenRequestStatus === "PENDING"
    ).length;

    const recentIssues = useMemo(
        () =>
            [...issues]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
                .slice(0, 5),
        [issues]
    );

    return (
        <>
            <section className="citizen-welcome">
                <div>
                    <span className="welcome-eyebrow">
                        CIVICOS / CITIZEN PORTAL
                    </span>
                    <h2>{t("Your CivicOS Dashboard")}</h2>
                    <p>
                        {t("Track the infrastructure issues you have reported and follow their progress in your community.")}
                    </p>
                </div>

                <button className="primary-button" onClick={openIssues}>
                    {t("View My Issues")} <span aria-hidden="true">→</span>
                </button>
            </section>

            <AnalyticsError message={error} onRetry={loadMyIssues} />

            {!loading && (feedbackDueCount > 0 || pendingReopenCount > 0) && (
                <section
                    className="citizen-follow-up-notice"
                    aria-label={t("Issue follow-up")}
                    aria-live="polite"
                >
                    <div>
                        <strong>{t("Your input helps close the loop")}</strong>
                        {feedbackDueCount > 0 && (
                            <p>
                                {feedbackDueCount}{" "}
                                {t("resolved issues are waiting for your rating.")}
                            </p>
                        )}
                        {pendingReopenCount > 0 && (
                            <p>
                                {pendingReopenCount}{" "}
                                {t("reopen requests are awaiting staff review.")}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={openIssues}
                    >
                        {t("Review my issues")}
                    </button>
                </section>
            )}

            <section className="dashboard-section">
                <SectionHeading
                    title="My Issue Overview"
                    description="A summary of the infrastructure reports you have submitted."
                    action={
                        <span className="live-indicator">
                            <span /> {t("My reports")}
                        </span>
                    }
                />

                <div className="stats-grid">
                    <StatCard
                        title="Total Reports"
                        value={loading ? "—" : stats.total}
                        description="All your submitted issues"
                        accent="#5367d9"
                    />
                    <StatCard
                        title="Awaiting Action"
                        value={loading ? "—" : awaitingAction}
                        description="Reported or verified"
                        accent="#e5a33b"
                    />
                    <StatCard
                        title="In Progress"
                        value={loading ? "—" : inProgressCount}
                        description="Assigned or being handled"
                        accent="#8c63d9"
                    />
                    <StatCard
                        title="Resolved"
                        value={loading ? "—" : completedCount}
                        description="Resolved or closed"
                        accent="#279b75"
                    />
                </div>
            </section>

            <section className="dashboard-panel citizen-map-panel">
                <SectionHeading
                    title="Community Issue Map"
                    description="Explore recent public infrastructure reports by location."
                    action={
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={refreshMapIssues}
                            disabled={mapLoading}
                        >
                            {mapLoading ? t("Refreshing...") : t("Refresh ↻")}
                        </button>
                    }
                />

                {mapError && (
                    <div className="analytics-error" role="alert">
                        <span>{mapError}</span>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={refreshMapIssues}
                            disabled={mapLoading}
                        >
                            {t("Retry")}
                        </button>
                    </div>
                )}

                <IssueMap
                    issues={mapIssues}
                    label={t("Community issue locations")}
                />

                <p className="citizen-map-caption" aria-live="polite">
                    {mapLoading
                        ? t("Loading community issue locations...")
                        : `${mapIssueTotal} ${t("mapped issues")}`}
                </p>

                {mapPages > 1 && (
                    <div className="issue-map-pagination">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => changeMapPage(mapPage - 1)}
                            disabled={mapLoading || mapPage === 0}
                        >
                            {t("Previous")}
                        </button>
                        <span>
                            {t("Page")} {mapPage + 1} {t("of")} {mapPages}
                        </span>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => changeMapPage(mapPage + 1)}
                            disabled={mapLoading || mapPage >= mapPages - 1}
                        >
                            {t("Next")}
                        </button>
                    </div>
                )}
            </section>

            <section className="dashboard-panel citizen-recent-panel">
                <SectionHeading
                    title="My Recent Reports"
                    description="The latest infrastructure issues you submitted."
                    action={
                        <button
                            className="secondary-button"
                            onClick={openIssues}
                        >
                            {t("View All →")}
                        </button>
                    }
                />

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
                        <button className="primary-button" onClick={openIssues}>
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
                                        <h3>{issue.title}</h3>
                                        <span
                                            className={`citizen-status status-${issue.status
                                                ?.toLowerCase()
                                                .replaceAll("_", "-")}`}
                                        >
                                            {formatStatus(issue.status, locale)}
                                        </span>
                                    </div>

                                    <p className="citizen-issue-description">
                                        {issue.description}
                                    </p>

                                    <div className="citizen-issue-meta">
                                        <span>
                                            {formatCategory(issue.category, locale)}
                                        </span>
                                        <span className="citizen-meta-dot">
                                            •
                                        </span>
                                        <span
                                            className={`citizen-priority priority-${issue.priority?.toLowerCase()}`}
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
                                            <strong>{issue.assignedToName}</strong>
                                        </p>
                                    )}
                                </div>
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
        </>
    );
}

/* MAIN DASHBOARD */

function Dashboard({ view = "overview" }) {
    const { t } = useLocale();
    const [role, setRole] = useState("");
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [recentIssues, setRecentIssues] = useState([]);
    const [recentIssuesLoading, setRecentIssuesLoading] = useState(false);
    const [recentIssuesError, setRecentIssuesError] = useState("");

    const [departmentSummaries, setDepartmentSummaries] = useState([]);
    const [departmentSummariesLoading, setDepartmentSummariesLoading] =
        useState(false);
    const [departmentSummariesError, setDepartmentSummariesError] =
        useState("");

    const [attention, setAttention] = useState(null);
    const [attentionLoading, setAttentionLoading] = useState(false);
    const [attentionError, setAttentionError] = useState("");

    const [priorityIssues, setPriorityIssues] = useState([]);
    const [priorityLoading, setPriorityLoading] = useState(false);
    const [priorityError, setPriorityError] = useState("");

    const [risks, setRisks] = useState([]);
    const [riskLoading, setRiskLoading] = useState(false);
    const [riskError, setRiskError] = useState("");

    const [trustScores, setTrustScores] = useState([]);
    const [trustLoading, setTrustLoading] = useState(false);
    const [trustError, setTrustError] = useState("");

    const [hotspots, setHotspots] = useState([]);
    const [hotspotLoading, setHotspotLoading] = useState(false);
    const [hotspotError, setHotspotError] = useState("");

    const loadDashboard = async (userRole, silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        setError("");

        try {
            if (userRole === "ADMIN") {
                const response = await api.get("/issues/dashboard/stats");
                setStats(response.data);
            } else if (userRole === "DEPARTMENT") {
                const response = await api.get("/issues/department/stats");
                setStats(response.data);
            } else {
                setStats(null);
            }
        } catch (err) {
            console.error("Dashboard loading error:", err);
            setError(
                err.response?.data?.message ||
                    t("Unable to load dashboard data. Please try again.")
            );
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const loadAttention = useCallback(async () => {
        setAttentionLoading(true);
        setAttentionError("");

        try {
            const response = await api.get("/issues/dashboard/attention");
            setAttention(response.data);
        } catch (err) {
            console.error("Dashboard attention loading error:", err);
            setAttentionError(
                err.response?.data?.message ||
                    t("Unable to load attention items.")
            );
        } finally {
            setAttentionLoading(false);
        }
    }, [t]);

    const loadPriorityIssues = useCallback(async () => {
        setPriorityLoading(true);
        setPriorityError("");

        try {
            const priorities = ["CRITICAL", "HIGH"];
            const activeStatuses = [
                "REPORTED",
                "VERIFIED",
                "ASSIGNED",
                "IN_PROGRESS",
            ];
            const responses = await Promise.all(
                priorities.flatMap((priority) =>
                    activeStatuses.map((status) =>
                        api.get("/issues/all", {
                            params: {
                                page: 0,
                                size: 10,
                                sort: "createdAt,desc",
                                priority,
                                status,
                            },
                        })
                    )
                )
            );
            const issues = responses.flatMap((response) => {
                const pageIssues = response.data?.content;
                if (!Array.isArray(pageIssues)) {
                    throw new Error("Unexpected priority issues response.");
                }
                return pageIssues;
            });
            setPriorityIssues(
                priorities.flatMap((priority) =>
                    issues
                        .filter((issue) => issue.priority === priority)
                        .sort(
                            (first, second) =>
                                new Date(second.createdAt).getTime() -
                                new Date(first.createdAt).getTime()
                        )
                        .slice(0, 10)
                )
            );
        } catch (err) {
            console.error("Priority issues loading error:", err);
            setPriorityError(
                err.response?.data?.message ||
                    t("Unable to load high-priority issues.")
            );
        } finally {
            setPriorityLoading(false);
        }
    }, [t]);

    const loadRecentIssues = useCallback(async () => {
        setRecentIssuesLoading(true);
        setRecentIssuesError("");

        try {
            const response = await api.get("/issues/all", {
                params: {
                    page: 0,
                    size: 5,
                    sort: "createdAt,desc",
                },
            });
            const issues = response.data?.content;
            if (!Array.isArray(issues)) {
                throw new Error("Unexpected recent issues response.");
            }
            setRecentIssues(issues);
        } catch (err) {
            console.error("Recent issues loading error:", err);
            setRecentIssuesError(
                err.response?.data?.message ||
                    t("Unable to load recent issues.")
            );
        } finally {
            setRecentIssuesLoading(false);
        }
    }, [t]);

    const loadDepartmentSummaries = useCallback(async () => {
        setDepartmentSummariesLoading(true);
        setDepartmentSummariesError("");

        try {
            const response = await api.get("/issues/dashboard/departments");
            if (!Array.isArray(response.data)) {
                throw new Error("Unexpected department summary response.");
            }
            setDepartmentSummaries(response.data);
        } catch (err) {
            console.error("Department issue summary loading error:", err);
            setDepartmentSummariesError(
                err.response?.data?.message ||
                    t("Unable to load department issue summary.")
            );
        } finally {
            setDepartmentSummariesLoading(false);
        }
    }, [t]);

    const loadRisk = async () => {
        setRiskLoading(true);
        setRiskError("");

        try {
            const response = await api.get("/issues/risk");
            setRisks(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Risk Radar loading error:", err);
            setRiskError(
                err.response?.data?.message ||
                    t("Unable to load risk analysis.")
            );
        } finally {
            setRiskLoading(false);
        }
    };

    const loadTrustScore = async (userRole) => {
        setTrustLoading(true);
        setTrustError("");

        try {
            const endpoint =
                userRole === "ADMIN"
                    ? "/issues/trust-score/all"
                    : "/issues/trust-score/my";

            const response = await api.get(endpoint);
            const data = response.data;

            setTrustScores(Array.isArray(data) ? data : data ? [data] : []);
        } catch (err) {
            console.error("Trust Score loading error:", err);
            setTrustError(
                err.response?.data?.message ||
                    t("Unable to load trust scores.")
            );
        } finally {
            setTrustLoading(false);
        }
    };

    const loadHotspots = async () => {
        setHotspotLoading(true);
        setHotspotError("");

        try {
            const response = await api.get("/issues/hotspots");
            setHotspots(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Hotspot loading error:", err);
            setHotspotError(
                err.response?.data?.message ||
                    t("Unable to load hotspot predictions.")
            );
        } finally {
            setHotspotLoading(false);
        }
    };

    useEffect(() => {
        const storedRole = (
            localStorage.getItem("civicos_role") || ""
        ).toUpperCase();

        setRole(storedRole);
        if (view === "overview") {
            loadDashboard(storedRole);
        } else {
            setLoading(false);
        }
    }, [view]);

    useEffect(() => {
        if (
            view === "overview" &&
            (role === "ADMIN" || role === "DEPARTMENT")
        ) {
            loadAttention();
        }
        if (view === "overview" && role === "ADMIN") {
            loadRecentIssues();
            loadDepartmentSummaries();
            loadPriorityIssues();
        }
        if (
            view === "insights" &&
            (role === "ADMIN" || role === "DEPARTMENT")
        ) {
            loadRisk();
            loadTrustScore(role);
            loadHotspots();
        }
    }, [
        role,
        view,
        loadAttention,
        loadRecentIssues,
        loadDepartmentSummaries,
        loadPriorityIssues,
    ]);

    const openIssues = () => {
        window.location.href = "/issues";
    };

    const refreshDashboard = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                loadDashboard(role, true),
                loadAttention(),
                loadRecentIssues(),
                loadDepartmentSummaries(),
                loadPriorityIssues(),
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const refreshAttentionItems = () => {
        loadAttention();
        if (role === "ADMIN") {
            loadPriorityIssues();
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>{t("Loading CivicOS dashboard...")}</p>
            </div>
        );
    }

    if (view === "insights") {
        return (
            <div className="dashboard admin-dashboard">
                <main className="dashboard-content">
                    <section className="admin-welcome">
                        <div>
                            <span className="welcome-eyebrow">
                                {t("CIVICOS / INSIGHTS")}
                            </span>
                            <h2>{t("Insights")}</h2>
                            <p>
                                {t("Explore civic risk, department performance, and emerging infrastructure hotspots.")}
                            </p>
                        </div>
                    </section>

                    <div className="insights-grid">
                        <CivicRiskPanel
                            risks={risks}
                            loading={riskLoading}
                            error={riskError}
                            onRetry={loadRisk}
                        />
                        <CivicTrustPanel
                            trustScores={trustScores}
                            loading={trustLoading}
                            error={trustError}
                            onRetry={() => loadTrustScore(role)}
                            role={role}
                        />
                        <CivicHotspotsPanel
                            hotspots={hotspots}
                            loading={hotspotLoading}
                            error={hotspotError}
                            onRetry={loadHotspots}
                        />
                    </div>
                </main>
            </div>
        );
    }

    const totalIssues = Number(stats?.totalIssues || 0);
    const resolvedIssues = Number(stats?.resolved || 0);
    const closedIssues = Number(stats?.closed || 0);
    const completedIssues = resolvedIssues + closedIssues;

    const completionRate =
        totalIssues > 0
            ? Math.round((completedIssues / totalIssues) * 100)
            : 0;

    const totalAssigned = Number(stats?.totalAssigned || 0);
    const departmentAssigned = Number(stats?.assigned || 0);
    const departmentInProgress = Number(stats?.inProgress || 0);
    const departmentResolved = Number(stats?.resolved || 0);

    const departmentCompletionRate =
        totalAssigned > 0
            ? Math.round((departmentResolved / totalAssigned) * 100)
            : 0;
    const issueStages = [
        { label: "Reported", value: Number(stats?.reported || 0), color: "#e5a33b" },
        { label: "Verified", value: Number(stats?.verified || 0), color: "#3988d8" },
        { label: "Assigned", value: Number(stats?.assigned || 0), color: "#8c63d9" },
        { label: "In Progress", value: Number(stats?.inProgress || 0), color: "#e18a42" },
        { label: "Resolved", value: resolvedIssues, color: "#279b75" },
        { label: "Closed", value: closedIssues, color: "#64748b" },
    ];
    const issueStageTotal = issueStages.reduce(
        (total, stage) => total + stage.value,
        0
    );

    return (
        <div className="dashboard admin-dashboard">
            <main className="dashboard-content">
                {role === "CITIZEN" ? (
                    <CitizenDashboard openIssues={openIssues} />
                ) : (
                    <>
                        <section className="admin-welcome">
                            <div>
                                <span className="welcome-eyebrow">
                                    {t("CIVICOS / OVERVIEW")}
                                </span>
                                <h2>
                                    {role === "ADMIN" && t("Admin Dashboard")}
                                    {role === "DEPARTMENT" &&
                                        t("Department Dashboard")}
                                    {!["ADMIN", "DEPARTMENT"].includes(role) &&
                                        t("Dashboard")}
                                </h2>
                                <p>
                                    {role === "DEPARTMENT"
                                        ? t("Track your department's assigned infrastructure issues and monitor work progress.")
                                        : t("Monitor public infrastructure reports and track issue progress from one place.")}
                                </p>
                            </div>

                            {role === "ADMIN" && (
                                <div className="admin-welcome-actions">
                                    <button
                                        type="button"
                                        className="secondary-button dashboard-refresh-button"
                                        onClick={refreshDashboard}
                                        disabled={refreshing}
                                        aria-label={t("Refresh dashboard")}
                                        aria-busy={refreshing}
                                    >
                                        <span
                                            className={`dashboard-refresh-icon${refreshing ? " is-refreshing" : ""}`}
                                            aria-hidden="true"
                                        >
                                            ↻
                                        </span>
                                        {refreshing
                                            ? t("Refreshing...")
                                            : t("Refresh")}
                                    </button>
                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={openIssues}
                                    >
                                        {t("Manage Issues")} →
                                    </button>
                                </div>
                            )}

                            {role === "DEPARTMENT" && (
                                <button
                                    className="primary-button"
                                    onClick={openIssues}
                                >
                                    {t("View My Assigned Issues")} →
                                </button>
                            )}
                        </section>

                        <AnalyticsError
                            message={error}
                            onRetry={() => loadDashboard(role)}
                        />

                        {role === "ADMIN" && stats && (
                            <>
                                <section className="dashboard-section">
                                    <SectionHeading
                                        title="Issue Overview"
                                        description="Current status of reported infrastructure issues."
                                        action={
                                            <span className="live-indicator">
                                                <span /> {t("Dashboard data")}
                                            </span>
                                        }
                                    />

                                    <div className="stats-grid admin-stats-grid">
                                        <StatCard
                                            title="Total Issues"
                                            value={stats.totalIssues}
                                            description="All recorded issues"
                                            accent="#5367d9"
                                            featured
                                        />
                                        <StatCard
                                            title="Reported"
                                            value={stats.reported}
                                            description="Awaiting verification"
                                            accent="#e5a33b"
                                        />
                                        <StatCard
                                            title="Verified"
                                            value={stats.verified}
                                            description="Ready for assignment"
                                            accent="#3988d8"
                                        />
                                        <StatCard
                                            title="Assigned"
                                            value={stats.assigned}
                                            description="Allocated to departments"
                                            accent="#8c63d9"
                                        />
                                        <StatCard
                                            title="In Progress"
                                            value={stats.inProgress}
                                            description="Currently being handled"
                                            accent="#e18a42"
                                        />
                                        <StatCard
                                            title="Resolved"
                                            value={stats.resolved}
                                            description="Marked as resolved"
                                            accent="#279b75"
                                        />
                                        <StatCard
                                            title="Closed"
                                            value={stats.closed}
                                            description="Workflow completed"
                                            accent="#64748b"
                                        />
                                    </div>

                                    <div className="status-distribution">
                                        <div className="status-distribution-heading">
                                            <strong>{t("Issue status distribution")}</strong>
                                            <span>
                                                {t("Current issues by workflow stage.")}
                                            </span>
                                        </div>
                                        <div
                                            className="status-distribution-bar"
                                            role="img"
                                            aria-label={t("Issue status distribution")}
                                        >
                                            {issueStages.map((stage) => (
                                                <span
                                                    key={stage.label}
                                                    style={{
                                                        width:
                                                            issueStageTotal > 0
                                                                ? `${(stage.value / issueStageTotal) * 100}%`
                                                                : "0%",
                                                        background: stage.color,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="status-distribution-legend">
                                            {issueStages.map((stage) => (
                                                <div
                                                    className="status-distribution-item"
                                                    key={stage.label}
                                                >
                                                    <span>
                                                        <i
                                                            style={{
                                                                background: stage.color,
                                                            }}
                                                        />
                                                        {t(stage.label)}
                                                    </span>
                                                    <strong>{stage.value}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <DashboardAttentionPanel
                                    attention={attention}
                                    loading={attentionLoading}
                                    error={attentionError}
                                    priorityIssues={priorityIssues}
                                    priorityLoading={priorityLoading}
                                    priorityError={priorityError}
                                    onRetry={refreshAttentionItems}
                                    onOpenIssues={openIssues}
                                    role={role}
                                />

                                <section className="dashboard-lower-grid">
                                    <div className="dashboard-panel">
                                        <SectionHeading
                                            title="Issues by Priority"
                                            description="Distribution across reported priority levels."
                                        />
                                        <div className="priority-list">
                                            <PriorityCard
                                                title="Critical"
                                                value={stats.criticalPriority}
                                                total={totalIssues}
                                                accent="#d94343"
                                            />
                                            <PriorityCard
                                                title="High"
                                                value={stats.highPriority}
                                                total={totalIssues}
                                                accent="#e58a36"
                                            />
                                            <PriorityCard
                                                title="Medium"
                                                value={stats.mediumPriority}
                                                total={totalIssues}
                                                accent="#d6ad35"
                                            />
                                            <PriorityCard
                                                title="Low"
                                                value={stats.lowPriority}
                                                total={totalIssues}
                                                accent="#399b76"
                                            />
                                        </div>
                                    </div>

                                    <div className="dashboard-panel completion-panel">
                                        <SectionHeading
                                            title="Resolution Progress"
                                            description="Resolved and closed issues compared with all issues."
                                        />

                                        <div className="completion-number">
                                            <strong>{completionRate}%</strong>
                                            <span>{t("Completed")}</span>
                                        </div>

                                        <div className="completion-track">
                                            <div
                                                className="completion-fill"
                                                style={{
                                                    width: `${completionRate}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="completion-details">
                                            <span>{t("Completed issues")}</span>
                                            <strong>
                                                {completedIssues} / {totalIssues}
                                            </strong>
                                        </div>

                                        <button
                                            className="secondary-button"
                                            onClick={openIssues}
                                        >
                                            {t("Go to issue management →")}
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}

                        {role === "ADMIN" && !stats && (
                            <DashboardAttentionPanel
                                attention={attention}
                                loading={attentionLoading}
                                error={attentionError}
                                priorityIssues={priorityIssues}
                                priorityLoading={priorityLoading}
                                priorityError={priorityError}
                                onRetry={refreshAttentionItems}
                                onOpenIssues={openIssues}
                                role={role}
                            />
                        )}

                        {role === "ADMIN" && (
                            <>
                                <DepartmentStatusSummary
                                    departments={departmentSummaries}
                                    loading={departmentSummariesLoading}
                                    error={departmentSummariesError}
                                    onRetry={loadDepartmentSummaries}
                                />
                                <AdminRecentIssues
                                    issues={recentIssues}
                                    loading={recentIssuesLoading}
                                    error={recentIssuesError}
                                    onRetry={loadRecentIssues}
                                    onOpenIssues={openIssues}
                                />
                            </>
                        )}

                        {role === "DEPARTMENT" && !stats && (
                            <DashboardAttentionPanel
                                attention={attention}
                                loading={attentionLoading}
                                error={attentionError}
                                priorityIssues={priorityIssues}
                                priorityLoading={priorityLoading}
                                priorityError={priorityError}
                                onRetry={refreshAttentionItems}
                                onOpenIssues={openIssues}
                                role={role}
                            />
                        )}

                        {role === "DEPARTMENT" && stats && (
                            <>
                                <section className="dashboard-section">
                                    <SectionHeading
                                        title="Department Work Overview"
                                        description="Summary of issues assigned to your department."
                                        action={
                                            <span className="live-indicator">
                                                <span /> {t("Dashboard data")}
                                            </span>
                                        }
                                    />

                                    <div className="stats-grid">
                                        <StatCard
                                            title="Total Assigned"
                                            value={stats.totalAssigned}
                                            description="Issues assigned to department"
                                            accent="#5367d9"
                                        />
                                        <StatCard
                                            title="Assigned"
                                            value={stats.assigned}
                                            description="Waiting to be started"
                                            accent="#8c63d9"
                                        />
                                        <StatCard
                                            title="In Progress"
                                            value={stats.inProgress}
                                            description="Currently being handled"
                                            accent="#e18a42"
                                        />
                                        <StatCard
                                            title="Resolved"
                                            value={stats.resolved}
                                            description="Marked as resolved"
                                            accent="#279b75"
                                        />
                                    </div>
                                </section>

                                <DashboardAttentionPanel
                                    attention={attention}
                                    loading={attentionLoading}
                                    error={attentionError}
                                    priorityIssues={priorityIssues}
                                    priorityLoading={priorityLoading}
                                    priorityError={priorityError}
                                    onRetry={refreshAttentionItems}
                                    onOpenIssues={openIssues}
                                    role={role}
                                />

                                <section className="dashboard-lower-grid">
                                    <div className="dashboard-panel completion-panel">
                                        <SectionHeading
                                            title="Department Resolution Progress"
                                            description="Resolved issues compared with all assigned issues."
                                        />

                                        <div className="completion-number">
                                            <strong>
                                                {departmentCompletionRate}%
                                            </strong>
                                            <span>{t("Resolved")}</span>
                                        </div>

                                        <div className="completion-track">
                                            <div
                                                className="completion-fill"
                                                style={{
                                                    width: `${departmentCompletionRate}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="completion-details">
                                            <span>{t("Resolved issues")}</span>
                                            <strong>
                                                {departmentResolved} / {totalAssigned}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="dashboard-panel">
                                        <SectionHeading
                                            title="Work Status"
                                            description="Current breakdown of your assigned workload."
                                        />

                                        <div className="priority-list">
                                            <PriorityCard
                                                title="Assigned"
                                                value={departmentAssigned}
                                                total={totalAssigned}
                                                accent="#8c63d9"
                                            />
                                            <PriorityCard
                                                title="In Progress"
                                                value={departmentInProgress}
                                                total={totalAssigned}
                                                accent="#e18a42"
                                            />
                                            <PriorityCard
                                                title="Resolved"
                                                value={departmentResolved}
                                                total={totalAssigned}
                                                accent="#279b75"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {(role === "ADMIN" || role === "DEPARTMENT") && (
                            <>
                                <section className="admin-quick-actions">
                                    <div>
                                        <h3>
                                            {role === "ADMIN"
                                                ? t("Quick Actions")
                                                : t("Manage Your Work")}
                                        </h3>
                                        <p>
                                            {role === "ADMIN"
                                                ? t("Review, verify, assign, and manage infrastructure reports.")
                                                : t("Review assigned issues and update their progress.")}
                                        </p>
                                    </div>

                                    <button
                                        className="secondary-button"
                                        onClick={openIssues}
                                    >
                                        {role === "ADMIN"
                                            ? t("Review and assign issues")
                                            : t("View My Assigned Issues")}{" "}
                                        →
                                    </button>
                                </section>
                            </>
                        )}

                        {role !== "ADMIN" &&
                            role !== "DEPARTMENT" &&
                            role !== "CITIZEN" && (
                                <div className="dashboard-card">
                                    <h3>{t("Unrecognized account role")}</h3>
                                    <p>
                                        {t("Please log out and sign in again with a valid CivicOS account.")}
                                    </p>
                                </div>
                            )}

                        {(role === "ADMIN" || role === "DEPARTMENT") &&
                            !stats &&
                            !error && (
                                <div className="dashboard-card">
                                    <h3>{t("No dashboard statistics available")}</h3>
                                    <p>
                                        {t("There is currently no statistics data to display.")}
                                    </p>
                                    <button
                                        className="primary-button"
                                        onClick={openIssues}
                                    >
                                        {t("Open Issues")}
                                    </button>
                                </div>
                            )}
                    </>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
