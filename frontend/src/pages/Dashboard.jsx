
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

function StatCard({ title, value, description, accent }) {
    return (
        <div className="admin-stat-card">
            <div className="stat-card-top">
                <span
                    className="stat-accent"
                    style={{ background: accent }}
                />
                <span className="stat-label">{title}</span>
            </div>

            <strong className="stat-value">{value ?? 0}</strong>
            <span className="stat-description">{description}</span>
        </div>
    );
}

function PriorityCard({ title, value, total, accent }) {
    const percentage = total > 0
        ? Math.round((Number(value || 0) / total) * 100)
        : 0;

    return (
        <div className="priority-card">
            <div className="priority-card-heading">
                <span
                    className="priority-dot"
                    style={{ background: accent }}
                />
                <span>{title}</span>
                <strong>{value ?? 0}</strong>
            </div>

            <div className="priority-track">
                <div
                    className="priority-fill"
                    style={{
                        width: `${percentage}%`,
                        background: accent
                    }}
                />
            </div>

            <small>{percentage}% of all issues</small>
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
        year: "numeric"
    });
}

function CitizenDashboard({ openIssues }) {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                "Unable to load your reports. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyIssues();
    }, []);

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
            closed: count("CLOSED")
        };
    }, [issues]);

    const awaitingAction = stats.reported + stats.verified;
    const inProgressCount = stats.assigned + stats.inProgress;
    const completedCount = stats.resolved + stats.closed;

    const recentIssues = useMemo(() => {
        return [...issues]
            .sort((a, b) => {
                return new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime();
            })
            .slice(0, 5);
    }, [issues]);

    return (
        <>
            <section className="citizen-welcome">
                <div>
                    <span className="welcome-eyebrow">
                        CIVICOS / CITIZEN PORTAL
                    </span>

                    <h2>Your CivicOS Dashboard</h2>

                    <p>
                        Track the infrastructure issues you have reported
                        and follow their progress in your community.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={openIssues}
                >
                    View My Issues <span aria-hidden="true">→</span>
                </button>
            </section>

            {error && (
                <div className="dashboard-error">
                    <span>{error}</span>
                    <button onClick={loadMyIssues}>
                        Retry
                    </button>
                </div>
            )}

            <section className="dashboard-section">
                <div className="section-heading">
                    <div>
                        <h3>My Issue Overview</h3>
                        <p>
                            A summary of the infrastructure reports
                            you have submitted.
                        </p>
                    </div>

                    <span className="live-indicator">
                        <span /> My reports
                    </span>
                </div>

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

            <section className="dashboard-panel citizen-recent-panel">
                <div className="section-heading">
                    <div>
                        <h3>My Recent Reports</h3>
                        <p>
                            The latest infrastructure issues you submitted.
                        </p>
                    </div>

                    <button
                        className="secondary-button"
                        onClick={openIssues}
                    >
                        View All →
                    </button>
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
                            className="primary-button"
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
                                        <h3>{issue.title}</h3>

                                        <span
                                            className={`citizen-status status-${issue.status
                                                ?.toLowerCase()
                                                .replaceAll("_", "-")}`}
                                        >
                                            {formatStatus(issue.status)}
                                        </span>
                                    </div>

                                    <p className="citizen-issue-description">
                                        {issue.description}
                                    </p>

                                    <div className="citizen-issue-meta">
                                        <span>
                                            {formatCategory(issue.category)}
                                        </span>

                                        <span className="citizen-meta-dot">
                                            •
                                        </span>

                                        <span
                                            className={`citizen-priority priority-${issue.priority?.toLowerCase()}`}
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
                        You can open your issue list to review your reports.
                    </p>
                </div>
            </section>
        </>
    );
}

function Dashboard() {
    const [role, setRole] = useState("");
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const storedRole = localStorage.getItem("civicos_role") || "";
        const normalizedRole = storedRole.toUpperCase();

        setRole(normalizedRole);
        loadDashboard(normalizedRole);
    }, []);

    const loadDashboard = async (userRole) => {
        setLoading(true);
        setError("");

        try {
            if (userRole === "ADMIN") {
                const response = await api.get(
                    "/issues/dashboard/stats"
                );

                setStats(response.data);
            } else if (userRole === "DEPARTMENT") {
                const response = await api.get(
                    "/issues/department/stats"
                );

                setStats(response.data);
            } else {
                setStats(null);
            }
        } catch (error) {
            console.error("Dashboard loading error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load dashboard data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("civicos_token");
        localStorage.removeItem("civicos_role");
        window.location.href = "/";
    };

    const openIssues = () => {
        window.location.href = "/issues";
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading CivicOS dashboard...</p>
            </div>
        );
    }

    const totalIssues = Number(stats?.totalIssues || 0);
    const resolvedIssues = Number(stats?.resolved || 0);
    const closedIssues = Number(stats?.closed || 0);
    const completedIssues = resolvedIssues + closedIssues;

    const completionRate = totalIssues > 0
        ? Math.round((completedIssues / totalIssues) * 100)
        : 0;

    // Department statistics
    const totalAssigned = Number(stats?.totalAssigned || 0);
    const departmentAssigned = Number(stats?.assigned || 0);
    const departmentInProgress = Number(stats?.inProgress || 0);
    const departmentResolved = Number(stats?.resolved || 0);

    const departmentCompletionRate = totalAssigned > 0
        ? Math.round((departmentResolved / totalAssigned) * 100)
        : 0;

    return (
        <div className="dashboard admin-dashboard">
            <header className="dashboard-header">
                <div className="brand-area">
                    <div className="brand-mark">C</div>

                    <div>
                        <h1>CivicOS</h1>
                        <p>Public Infrastructure Management</p>
                    </div>
                </div>

                <div className="header-right">
                    <span className="role-badge">{role}</span>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                {role === "CITIZEN" ? (
                    <CitizenDashboard openIssues={openIssues} />
                ) : (
                    <>
                        <section className="admin-welcome">
                            <div>
                                <span className="welcome-eyebrow">
                                    CIVICOS / OVERVIEW
                                </span>

                                <h2>
                                    {role === "ADMIN" && "Admin Dashboard"}
                                    {role === "DEPARTMENT" && "Department Dashboard"}
                                    {!["ADMIN", "DEPARTMENT"].includes(role) &&
                                        "Dashboard"}
                                </h2>

                                <p>
                                    {role === "DEPARTMENT"
                                        ? "Track your department's assigned infrastructure issues and monitor work progress."
                                        : "Monitor public infrastructure reports and track issue progress from one place."
                                    }
                                </p>
                            </div>

                            {role === "ADMIN" && (
                                <button
                                    className="primary-button"
                                    onClick={openIssues}
                                >
                                    Manage Issues <span aria-hidden="true">→</span>
                                </button>
                            )}

                            {role === "DEPARTMENT" && (
                                <button
                                    className="primary-button"
                                    onClick={openIssues}
                                >
                                    View My Assigned Issues <span aria-hidden="true">→</span>
                                </button>
                            )}
                        </section>

                        {error && (
                            <div className="dashboard-error">
                                <span>{error}</span>

                                {(role === "ADMIN" || role === "DEPARTMENT") && (
                                    <button onClick={() => loadDashboard(role)}>
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ADMIN DASHBOARD */}
                        {role === "ADMIN" && stats && (
                            <>
                                <section className="dashboard-section">
                                    <div className="section-heading">
                                        <div>
                                            <h3>Issue Overview</h3>
                                            <p>
                                                Current status of reported infrastructure issues.
                                            </p>
                                        </div>

                                        <span className="live-indicator">
                                            <span /> Dashboard data
                                        </span>
                                    </div>

                                    <div className="stats-grid">
                                        <StatCard
                                            title="Total Issues"
                                            value={stats.totalIssues}
                                            description="All recorded issues"
                                            accent="#5367d9"
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
                                </section>

                                <section className="dashboard-lower-grid">
                                    <div className="dashboard-panel">
                                        <div className="section-heading">
                                            <div>
                                                <h3>Issues by Priority</h3>
                                                <p>
                                                    Distribution across reported priority levels.
                                                </p>
                                            </div>
                                        </div>

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
                                        <div className="section-heading">
                                            <div>
                                                <h3>Resolution Progress</h3>
                                                <p>
                                                    Resolved and closed issues compared with all issues.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="completion-number">
                                            <strong>{completionRate}%</strong>
                                            <span>completed</span>
                                        </div>

                                        <div className="completion-track">
                                            <div
                                                className="completion-fill"
                                                style={{ width: `${completionRate}%` }}
                                            />
                                        </div>

                                        <div className="completion-details">
                                            <span>Completed issues</span>
                                            <strong>
                                                {completedIssues} / {totalIssues}
                                            </strong>
                                        </div>

                                        <button
                                            className="secondary-button"
                                            onClick={openIssues}
                                        >
                                            Go to issue management →
                                        </button>
                                    </div>
                                </section>

                                <section className="admin-quick-actions">
                                    <div>
                                        <h3>Quick Actions</h3>
                                        <p>
                                            Access the main issue management workspace.
                                        </p>
                                    </div>

                                    <button
                                        className="secondary-button"
                                        onClick={openIssues}
                                    >
                                        Review and assign issues →
                                    </button>
                                </section>
                            </>
                        )}

                        {/* DEPARTMENT DASHBOARD */}
                        {role === "DEPARTMENT" && stats && (
                            <>
                                <section className="dashboard-section">
                                    <div className="section-heading">
                                        <div>
                                            <h3>Department Work Overview</h3>
                                            <p>
                                                Summary of issues assigned to your department.
                                            </p>
                                        </div>

                                        <span className="live-indicator">
                                            <span /> Dashboard data
                                        </span>
                                    </div>

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

                                <section className="dashboard-lower-grid">
                                    <div className="dashboard-panel completion-panel">
                                        <div className="section-heading">
                                            <div>
                                                <h3>Department Resolution Progress</h3>
                                                <p>
                                                    Resolved issues compared with all assigned issues.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="completion-number">
                                            <strong>{departmentCompletionRate}%</strong>
                                            <span>resolved</span>
                                        </div>

                                        <div className="completion-track">
                                            <div
                                                className="completion-fill"
                                                style={{
                                                    width: `${departmentCompletionRate}%`
                                                }}
                                            />
                                        </div>

                                        <div className="completion-details">
                                            <span>Resolved issues</span>
                                            <strong>
                                                {departmentResolved} / {totalAssigned}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="dashboard-panel">
                                        <div className="section-heading">
                                            <div>
                                                <h3>Work Status</h3>
                                                <p>
                                                    Current breakdown of your assigned workload.
                                                </p>
                                            </div>
                                        </div>

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

                                <section className="admin-quick-actions">
                                    <div>
                                        <h3>Manage Your Work</h3>
                                        <p>
                                            Open your assigned issues to review details
                                            and update their status.
                                        </p>
                                    </div>

                                    <button
                                        className="secondary-button"
                                        onClick={openIssues}
                                    >
                                        View My Assigned Issues →
                                    </button>
                                </section>
                            </>
                        )}

                        {/* ADMIN EMPTY STATE */}
                        {role === "ADMIN" && !stats && !error && (
                            <div className="dashboard-card">
                                <h3>No dashboard statistics available</h3>
                                <p>
                                    There is currently no statistics data to display.
                                </p>

                                <button
                                    className="primary-button"
                                    onClick={openIssues}
                                >
                                    Manage Issues
                                </button>
                            </div>
                        )}

                        {/* DEPARTMENT EMPTY STATE */}
                        {role === "DEPARTMENT" && !stats && !error && (
                            <div className="dashboard-card">
                                <h3>No department statistics available</h3>
                                <p>
                                    There is currently no assigned-issue data to display.
                                </p>

                                <button
                                    className="primary-button"
                                    onClick={openIssues}
                                >
                                    View My Assigned Issues
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