import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { translateStatus, useLocale } from "../i18n/LocaleContext";

function Departments() {
    const { locale, t } = useLocale();
    const [officers, setOfficers] = useState([]);
    const [trustScores, setTrustScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [trustError, setTrustError] = useState("");
    const [search, setSearch] = useState("");

    const loadDepartments = useCallback(async () => {
        setLoading(true);
        setError("");
        setTrustError("");

        const [officerResult, trustResult] = await Promise.allSettled([
            api.get("/admin/department-officers"),
            api.get("/issues/trust-score/all"),
        ]);

        if (officerResult.status === "fulfilled") {
            setOfficers(
                Array.isArray(officerResult.value.data)
                    ? officerResult.value.data
                    : []
            );
        } else {
            console.error(
                "Department directory loading error:",
                officerResult.reason
            );
            setError(
                officerResult.reason.response?.data?.message ||
                    t("Unable to load departments.")
            );
        }

        if (trustResult.status === "fulfilled") {
            setTrustScores(
                Array.isArray(trustResult.value.data)
                    ? trustResult.value.data
                    : []
            );
        } else {
            console.error(
                "Department performance loading error:",
                trustResult.reason
            );
            setTrustError(
                trustResult.reason.response?.data?.message ||
                    t("Unable to load department performance.")
            );
        }

        setLoading(false);
    }, [t]);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    const trustByDepartmentId = useMemo(
        () =>
            new Map(
                trustScores.map((score) => [
                    String(score.departmentId),
                    score,
                ])
            ),
        [trustScores]
    );

    const filteredOfficers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return officers;
        return officers.filter(
            (officer) =>
                String(officer.name || "").toLowerCase().includes(query) ||
                String(officer.email || "").toLowerCase().includes(query)
        );
    }, [officers, search]);

    return (
        <div className="dashboard admin-dashboard">
            <main className="dashboard-content">
                <section className="admin-welcome">
                    <div>
                        <span className="welcome-eyebrow">
                            {t("CIVICOS / ADMINISTRATION")}
                        </span>
                        <h1>{t("Department officers")}</h1>
                        <p>
                            {t("Browse department officers and compare service performance.")}
                        </p>
                    </div>
                    <span
                        className="department-count"
                        role="status"
                        aria-live="polite"
                    >
                        <span aria-hidden="true">
                            {loading ? "—" : filteredOfficers.length}
                        </span>
                        {!loading &&
                            t(
                                filteredOfficers.length === 1
                                    ? "officer"
                                    : "officers"
                            )}
                    </span>
                </section>

                <section className="dashboard-panel department-directory-panel">
                    <div className="department-search">
                        <label htmlFor="officer-search">
                            {t("Search officers")}
                        </label>
                        <input
                            id="officer-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("Search by officer name or email")}
                        />
                    </div>

                    {error && (
                        <div className="dashboard-error" role="alert">
                            <span>{error}</span>
                            <button type="button" onClick={loadDepartments}>
                                {t("Retry")}
                            </button>
                        </div>
                    )}

                    {trustError && (
                        <div className="dashboard-error" role="alert">
                            <span>{trustError}</span>
                            <button type="button" onClick={loadDepartments}>
                                {t("Retry")}
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div
                            className="departments-loading"
                            role="status"
                            aria-live="polite"
                        >
                            <div className="loading-spinner" />
                            <span>{t("Loading officers...")}</span>
                        </div>
                    ) : error ? null : filteredOfficers.length === 0 ? (
                        <p className="analytics-message" role="status">
                            {search
                                ? t("No officers match your search.")
                                : t("No department officers are available.")}
                        </p>
                    ) : (
                        <div
                            className="department-directory-grid"
                            role="region"
                            aria-label={t("Department officers list")}
                        >
                            {filteredOfficers.map((officer) => {
                                const score = trustByDepartmentId.get(
                                    String(officer.id)
                                );
                                const trustValue = score
                                    ? Math.max(
                                          0,
                                          Math.min(
                                              100,
                                              Number(score.trustScore || 0)
                                          )
                                      )
                                    : null;
                                const initials = String(officer.name || "D")
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part.charAt(0))
                                    .join("")
                                    .toUpperCase();

                                return (
                                    <article
                                        className="department-directory-card"
                                        key={officer.id}
                                    >
                                        <div className="department-card-heading">
                                            <span
                                                className="department-avatar"
                                                aria-hidden="true"
                                            >
                                                {initials}
                                            </span>
                                            <div>
                                                <h3>{officer.name}</h3>
                                                <a href={`mailto:${officer.email}`}>
                                                    {officer.email}
                                                </a>
                                            </div>
                                        </div>

                                        {score ? (
                                            <>
                                                <div className="department-score-row">
                                                    <span>
                                                        {t("Trust score")}
                                                    </span>
                                                    <strong>
                                                        {trustValue}
                                                        <small> / 100</small>
                                                    </strong>
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
                                                        style={{
                                                            width: `${trustValue}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="department-metrics">
                                                    <div>
                                                        <span>
                                                            {t("Resolution rate")}
                                                        </span>
                                                        <strong>
                                                            {Number(
                                                                score.resolutionRate ||
                                                                    0
                                                            ).toFixed(1)}
                                                            %
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span>
                                                            {t("Resolved")}
                                                        </span>
                                                        <strong>
                                                            {score.resolvedIssues ??
                                                                0}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span>
                                                            {t("Unresolved")}
                                                        </span>
                                                        <strong>
                                                            {score.unresolvedIssues ??
                                                                0}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span>
                                                            {t("Trust level")}
                                                        </span>
                                                        <strong>
                                                            {translateStatus(
                                                                locale,
                                                                score.trustLevel
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="department-no-score">
                                                {trustError
                                                    ? t(
                                                          "Performance data is temporarily unavailable."
                                                      )
                                                    : t(
                                                          "No performance data is available yet."
                                                      )}
                                            </p>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Departments;
