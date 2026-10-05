import { useEffect, useState } from "react";
import api from "../api/axios";

function Issues() {
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [assigningIssue, setAssigningIssue] = useState(null);

    const [officers, setOfficers] = useState([]);
    const [officersLoading, setOfficersLoading] = useState(false);

    const [assignedTo, setAssignedTo] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState("");

    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusError, setStatusError] = useState("");

    const [success, setSuccess] = useState("");

    // =========================================================
    // CREATE ISSUE / EVIDENCE PHOTO
    // =========================================================

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingIssue, setCreatingIssue] = useState(false);
    const [createIssueError, setCreateIssueError] = useState("");

    const [issueForm, setIssueForm] = useState({
        title: "",
        description: "",
        category: "",
        priority: "",
        latitude: "",
        longitude: ""
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    // Civic Memory / Recurring Issue state
    const [recurringIssues, setRecurringIssues] = useState([]);
    const [recurringLoading, setRecurringLoading] = useState(false);
    const [recurringError, setRecurringError] = useState("");

    const currentRole = (
        localStorage.getItem("civicos_role") || ""
    ).toUpperCase();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [category, setCategory] = useState("");

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const pageSize = 10;

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("civicos_token")}`
    });

    // =========================================================
    // IMAGE URL
    // =========================================================

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) {
            return "";
        }

        if (
            imageUrl.startsWith("http://") ||
            imageUrl.startsWith("https://")
        ) {
            return imageUrl;
        }

        const baseUrl =
            api.defaults?.baseURL ||
            "http://localhost:8080/api";

        const serverUrl = baseUrl.replace(
            /\/api\/?$/,
            ""
        );

        return `${serverUrl}${
            imageUrl.startsWith("/")
                ? imageUrl
                : `/${imageUrl}`
        }`;
    };

    // =========================================================
    // ISSUE LIST HELPERS
    // =========================================================

    const getIssueList = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.content)) {
            return data.content;
        }

        return [];
    };

    const applyDepartmentIssues = (
        data,
        targetPage = page,
        useFilters = true
    ) => {
        let filteredIssues = getIssueList(data);

        if (useFilters) {
            const searchText = keyword.trim().toLowerCase();
            const categoryText = category.trim().toLowerCase();

            filteredIssues = filteredIssues.filter((issue) => {
                const matchesKeyword =
                    !searchText ||
                    String(issue.title || "")
                        .toLowerCase()
                        .includes(searchText) ||
                    String(issue.description || "")
                        .toLowerCase()
                        .includes(searchText);

                const matchesStatus =
                    !status || issue.status === status;

                const matchesPriority =
                    !priority || issue.priority === priority;

                const matchesCategory =
                    !categoryText ||
                    String(issue.category || "")
                        .toLowerCase()
                        .includes(categoryText);

                return (
                    matchesKeyword &&
                    matchesStatus &&
                    matchesPriority &&
                    matchesCategory
                );
            });
        }

        filteredIssues.sort((a, b) => {
            return (
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
            );
        });

        const filteredTotal = filteredIssues.length;

        const calculatedTotalPages = Math.ceil(
            filteredTotal / pageSize
        );

        const safePage = Math.max(
            0,
            Math.min(
                targetPage,
                Math.max(0, calculatedTotalPages - 1)
            )
        );

        const startIndex = safePage * pageSize;

        const paginatedIssues = filteredIssues.slice(
            startIndex,
            startIndex + pageSize
        );

        setIssues(paginatedIssues);
        setTotalElements(filteredTotal);
        setTotalPages(calculatedTotalPages);

        if (safePage !== targetPage) {
            setPage(safePage);
        }
    };

    // =========================================================
    // LOAD ISSUES
    // =========================================================

    const loadIssues = async () => {
        setLoading(true);
        setError("");

        try {
            if (currentRole === "DEPARTMENT") {
                const response = await api.get(
                    "/issues/assigned",
                    {
                        headers: getAuthHeaders()
                    }
                );

                applyDepartmentIssues(
                    response.data,
                    page,
                    true
                );
            } else if (currentRole === "CITIZEN") {
                const response = await api.get(
                    "/issues/my",
                    {
                        headers: getAuthHeaders()
                    }
                );

                applyDepartmentIssues(
                    response.data,
                    page,
                    true
                );
            } else {
                const response = await api.get(
                    "/issues/all",
                    {
                        params: {
                            page,
                            size: pageSize,
                            sort: "createdAt,desc",
                            ...(keyword.trim() && {
                                keyword: keyword.trim()
                            }),
                            ...(status && { status }),
                            ...(priority && { priority }),
                            ...(category.trim() && {
                                category:
                                    category.trim().toUpperCase()
                            })
                        },
                        headers: getAuthHeaders()
                    }
                );

                setIssues(response.data.content || []);
                setTotalPages(
                    response.data.totalPages || 0
                );
                setTotalElements(
                    response.data.totalElements || 0
                );
            }
        } catch (err) {
            console.error(
                "Issue loading error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load issues."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // LOAD ISSUES WITH CLEAR FILTERS
    // =========================================================

    const loadIssuesWithClearFilters = async () => {
        setLoading(true);
        setError("");

        try {
            if (currentRole === "DEPARTMENT") {
                const response = await api.get(
                    "/issues/assigned",
                    {
                        headers: getAuthHeaders()
                    }
                );

                applyDepartmentIssues(
                    response.data,
                    0,
                    false
                );
            } else if (currentRole === "CITIZEN") {
                const response = await api.get(
                    "/issues/my",
                    {
                        headers: getAuthHeaders()
                    }
                );

                applyDepartmentIssues(
                    response.data,
                    0,
                    false
                );
            } else {
                const response = await api.get(
                    "/issues/all",
                    {
                        params: {
                            page: 0,
                            size: pageSize,
                            sort: "createdAt,desc"
                        },
                        headers: getAuthHeaders()
                    }
                );

                setIssues(response.data.content || []);
                setTotalPages(
                    response.data.totalPages || 0
                );
                setTotalElements(
                    response.data.totalElements || 0
                );
            }
        } catch (err) {
            console.error(
                "Issue loading error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load issues."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIssues();
    }, [page]);

    // =========================================================
    // CREATE ISSUE
    // =========================================================

    const resetIssueForm = () => {
        setIssueForm({
            title: "",
            description: "",
            category: "",
            priority: "",
            latitude: "",
            longitude: ""
        });

        setImageFile(null);
        setImagePreview("");
        setCreateIssueError("");
    };

    const openCreateModal = () => {
        resetIssueForm();
        setShowCreateModal(true);
        setSuccess("");
    };

    const closeCreateModal = () => {
        if (creatingIssue) {
            return;
        }

        setShowCreateModal(false);
        resetIssueForm();
    };

    const handleIssueFormChange = (event) => {
        const { name, value } = event.target;

        setIssueForm((currentForm) => ({
            ...currentForm,
            [name]: value
        }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setImageFile(null);
            setImagePreview("");
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            setCreateIssueError(
                "Only JPEG, PNG and WEBP images are allowed."
            );

            event.target.value = "";
            setImageFile(null);
            setImagePreview("");
            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            setCreateIssueError(
                "Image size cannot exceed 5 MB."
            );

            event.target.value = "";
            setImageFile(null);
            setImagePreview("");
            return;
        }

        setCreateIssueError("");
        setImageFile(file);

        const previewUrl =
            URL.createObjectURL(file);

        setImagePreview(previewUrl);
    };

    const handleCreateIssue = async (event) => {
        event.preventDefault();

        if (creatingIssue) {
            return;
        }

        setCreateIssueError("");
        setSuccess("");

        const title =
            issueForm.title.trim();

        const description =
            issueForm.description.trim();

        const latitude =
            Number(issueForm.latitude);

        const longitude =
            Number(issueForm.longitude);

        if (!title) {
            setCreateIssueError(
                "Please enter an issue title."
            );
            return;
        }

        if (!description) {
            setCreateIssueError(
                "Please enter an issue description."
            );
            return;
        }

        if (!issueForm.category) {
            setCreateIssueError(
                "Please select an issue category."
            );
            return;
        }

        if (!issueForm.priority) {
            setCreateIssueError(
                "Please select an issue priority."
            );
            return;
        }

        if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {
            setCreateIssueError(
                "Please enter a valid latitude between -90 and 90."
            );
            return;
        }

        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            setCreateIssueError(
                "Please enter a valid longitude between -180 and 180."
            );
            return;
        }

        setCreatingIssue(true);

        try {
            const issueData = {
                title,
                description,
                category: issueForm.category,
                priority: issueForm.priority,
                latitude,
                longitude
            };

            const formData = new FormData();

            formData.append(
                "issue",
                new Blob(
                    [JSON.stringify(issueData)],
                    {
                        type: "application/json"
                    }
                )
            );

            if (imageFile) {
                formData.append(
                    "image",
                    imageFile
                );
            }

            const response = await api.post(
                "/issues",
                formData,
                {
                    headers: getAuthHeaders()
                }
            );

            const createdIssue = response.data;

            setShowCreateModal(false);
            resetIssueForm();

            setSuccess(
                `Issue #${createdIssue.id} was reported successfully.`
            );

            if (page === 0) {
                await loadIssues();
            } else {
                setPage(0);
            }
        } catch (err) {
            console.error(
                "Issue creation error:",
                err
            );

            setCreateIssueError(
                err.response?.data?.message ||
                "Unable to report this issue. Please try again."
            );
        } finally {
            setCreatingIssue(false);
        }
    };

    // =========================================================
    // CIVIC MEMORY / RECURRING ISSUE ENGINE
    // =========================================================

    const loadRecurringIssues = async (issueId) => {
        if (
            currentRole === "CITIZEN" ||
            !issueId
        ) {
            setRecurringIssues([]);
            setRecurringError("");
            return;
        }

        setRecurringLoading(true);
        setRecurringError("");
        setRecurringIssues([]);

        try {
            const response = await api.get(
                `/issues/${issueId}/recurring`,
                {
                    headers: getAuthHeaders()
                }
            );

            setRecurringIssues(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            console.error(
                "Recurring issue loading error:",
                err
            );

            setRecurringError(
                err.response?.data?.message ||
                "Unable to check for recurring issues."
            );
        } finally {
            setRecurringLoading(false);
        }
    };

    const formatDistance = (distance) => {
        if (
            distance === null ||
            distance === undefined ||
            Number.isNaN(Number(distance))
        ) {
            return "-";
        }

        const value = Number(distance);

        if (value < 1000) {
            return `${value.toFixed(0)} m`;
        }

        return `${(value / 1000).toFixed(2)} km`;
    };

    const closeIssueModal = () => {
        setSelectedIssue(null);
        setRecurringIssues([]);
        setRecurringError("");
        setRecurringLoading(false);
        setStatusError("");
    };

    // =========================================================
    // OFFICERS
    // =========================================================

    const loadDepartmentOfficers = async () => {
        setOfficersLoading(true);
        setAssignError("");

        try {
            const response = await api.get(
                "/admin/department-officers",
                {
                    headers: getAuthHeaders()
                }
            );

            setOfficers(response.data || []);
        } catch (err) {
            console.error(
                "Officer loading error:",
                err
            );

            setAssignError(
                err.response?.data?.message ||
                "Unable to load department officers."
            );
        } finally {
            setOfficersLoading(false);
        }
    };

    // =========================================================
    // SEARCH / FILTERS
    // =========================================================

    const handleSearch = (event) => {
        event.preventDefault();

        if (page === 0) {
            loadIssues();
        } else {
            setPage(0);
        }
    };

    const handleClearFilters = () => {
        setKeyword("");
        setStatus("");
        setPriority("");
        setCategory("");
        setPage(0);

        if (page === 0) {
            loadIssuesWithClearFilters();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(
            "civicos_token"
        );

        localStorage.removeItem(
            "civicos_role"
        );

        window.location.href = "/";
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? "-"
            : parsedDate.toLocaleString();
    };

    // =========================================================
    // ASSIGNMENT
    // =========================================================

    const openAssignModal = (issue) => {
        setAssigningIssue(issue);
        setAssignedTo("");
        setAssignError("");
        setSuccess("");

        loadDepartmentOfficers();
    };

    const closeAssignModal = () => {
        if (assigning) return;

        setAssigningIssue(null);
        setAssignedTo("");
        setAssignError("");
    };

    const handleAssign = async (event) => {
        event.preventDefault();

        const officerId = Number(assignedTo);

        if (
            !Number.isInteger(officerId) ||
            officerId <= 0
        ) {
            setAssignError(
                "Please select a valid department officer."
            );
            return;
        }

        if (
            !assigningIssue ||
            assigning
        ) {
            return;
        }

        setAssigning(true);
        setAssignError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/issues/${assigningIssue.id}/assign`,
                {
                    assignedTo: officerId
                },
                {
                    headers: getAuthHeaders()
                }
            );

            const updatedIssue = response.data;

            setIssues((currentIssues) =>
                currentIssues.map((issue) =>
                    issue.id === updatedIssue.id
                        ? updatedIssue
                        : issue
                )
            );

            setSelectedIssue((currentIssue) =>
                currentIssue?.id === updatedIssue.id
                    ? updatedIssue
                    : currentIssue
            );

            setAssigningIssue(null);
            setAssignedTo("");

            setSuccess(
                `Issue #${updatedIssue.id} was assigned successfully.`
            );

            await loadIssues();
        } catch (err) {
            console.error(
                "Issue assignment error:",
                err
            );

            setAssignError(
                err.response?.data?.message ||
                "Unable to assign this issue. Please try again."
            );
        } finally {
            setAssigning(false);
        }
    };

    // =========================================================
    // STATUS
    // =========================================================

    const getNextStatus = (issue) => {
        if (!issue) return "";

        if (
            issue.status === "REPORTED" &&
            currentRole === "ADMIN"
        ) {
            return "VERIFIED";
        }

        if (
            issue.status === "ASSIGNED" &&
            currentRole === "DEPARTMENT"
        ) {
            return "IN_PROGRESS";
        }

        if (
            issue.status === "IN_PROGRESS" &&
            currentRole === "DEPARTMENT"
        ) {
            return "RESOLVED";
        }

        return "";
    };

    const handleStatusUpdate = async () => {
        const nextStatus =
            getNextStatus(selectedIssue);

        if (
            !nextStatus ||
            statusUpdating
        ) {
            return;
        }

        setStatusUpdating(true);
        setStatusError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/issues/${selectedIssue.id}/status`,
                {
                    status: nextStatus
                },
                {
                    headers: getAuthHeaders()
                }
            );

            const updatedIssue = response.data;

            setSelectedIssue(updatedIssue);

            setIssues((currentIssues) =>
                currentIssues.map((issue) =>
                    issue.id === updatedIssue.id
                        ? updatedIssue
                        : issue
                )
            );

            setSuccess(
                `Issue #${updatedIssue.id} status changed to ${nextStatus.replaceAll("_", " ")}.`
            );

            await loadIssues();

            await loadRecurringIssues(
                updatedIssue.id
            );
        } catch (err) {
            console.error(
                "Status update error:",
                err
            );

            setStatusError(
                err.response?.data?.message ||
                "Unable to update this issue's status. Please try again."
            );
        } finally {
            setStatusUpdating(false);
        }
    };

    // =========================================================
    // ROLE TEXT
    // =========================================================

    const getRoleTitle = () => {
        if (currentRole === "DEPARTMENT") {
            return "My Assigned Issues";
        }

        if (currentRole === "CITIZEN") {
            return "My Reported Issues";
        }

        return "Issue Management";
    };

    const getRoleDescription = () => {
        if (currentRole === "DEPARTMENT") {
            return "View and update public infrastructure issues assigned to you.";
        }

        if (currentRole === "CITIZEN") {
            return "View, search and track the infrastructure issues you have reported.";
        }

        return "View, search, filter and assign public infrastructure issues.";
    };

    const getIssuesCardTitle = () => {
        if (currentRole === "DEPARTMENT") {
            return "Assigned to Me";
        }

        if (currentRole === "CITIZEN") {
            return "My Reports";
        }

        return "Issues";
    };

    const getEmptyMessage = () => {
        if (currentRole === "DEPARTMENT") {
            return "No issues are currently assigned to you.";
        }

        if (currentRole === "CITIZEN") {
            return "You have not reported any issues yet.";
        }

        return "No issues found.";
    };

    return (
        <div className="issues-page">

            {/* =================================================
                HEADER
            ================================================== */}

            <header className="dashboard-header">
                <div>
                    <h1>CivicOS</h1>
                    <p>
                        Public Infrastructure Management
                    </p>
                </div>

                <div className="header-right">
                    <span className="role-badge">
                        {currentRole || "USER"}
                    </span>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="issues-content">

                {/* =================================================
                    PAGE TITLE
                ================================================== */}

                <div className="issues-title-row">
                    <div>
                        <h2>{getRoleTitle()}</h2>
                        <p>{getRoleDescription()}</p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center"
                        }}
                    >
                        {currentRole === "CITIZEN" && (
                            <button
                                type="button"
                                className="primary-button"
                                onClick={openCreateModal}
                            >
                                + Report New Issue
                            </button>
                        )}

                        <button
                            className="secondary-button"
                            onClick={() => {
                                window.location.href = "/";
                            }}
                        >
                            ← Dashboard
                        </button>
                    </div>
                </div>

                {/* =================================================
                    SUCCESS MESSAGE
                ================================================== */}

                {success && (
                    <div
                        className="issues-success"
                        role="status"
                    >
                        {success}

                        <button
                            type="button"
                            onClick={() =>
                                setSuccess("")
                            }
                            aria-label="Dismiss success message"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* =================================================
                    ISSUES CARD
                ================================================== */}

                <section className="issues-card">

                    <div className="issues-card-header">
                        <div>
                            <h3>
                                {getIssuesCardTitle()}
                            </h3>

                            <p>
                                {totalElements} issue
                                {totalElements === 1
                                    ? ""
                                    : "s"} found
                            </p>
                        </div>
                    </div>

                    {/* =================================================
                        FILTERS
                    ================================================== */}

                    <form
                        className="issues-filters"
                        onSubmit={handleSearch}
                    >
                        <div className="filter-field">
                            <label htmlFor="keyword">
                                Search
                            </label>

                            <input
                                id="keyword"
                                type="text"
                                value={keyword}
                                onChange={(event) =>
                                    setKeyword(
                                        event.target.value
                                    )
                                }
                                placeholder="Search title or description"
                            />
                        </div>

                        <div className="filter-field">
                            <label htmlFor="status">
                                Status
                            </label>

                            <select
                                id="status"
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Statuses
                                </option>

                                <option value="REPORTED">
                                    Reported
                                </option>

                                <option value="VERIFIED">
                                    Verified
                                </option>

                                <option value="ASSIGNED">
                                    Assigned
                                </option>

                                <option value="IN_PROGRESS">
                                    In Progress
                                </option>

                                <option value="RESOLVED">
                                    Resolved
                                </option>
                            </select>
                        </div>

                        <div className="filter-field">
                            <label htmlFor="priority">
                                Priority
                            </label>

                            <select
                                id="priority"
                                value={priority}
                                onChange={(event) =>
                                    setPriority(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Priorities
                                </option>

                                <option value="LOW">
                                    Low
                                </option>

                                <option value="MEDIUM">
                                    Medium
                                </option>

                                <option value="HIGH">
                                    High
                                </option>

                                <option value="CRITICAL">
                                    Critical
                                </option>
                            </select>
                        </div>

                        <div className="filter-field">
                            <label htmlFor="category">
                                Category
                            </label>

                            <select
                                id="category"
                                value={category}
                                onChange={(event) =>
                                    setCategory(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Categories
                                </option>

                                <option value="ROADS">
                                    Roads
                                </option>

                                <option value="STREETLIGHTS">
                                    Streetlights
                                </option>

                                <option value="WATER">
                                    Water
                                </option>

                                <option value="DRAINAGE">
                                    Drainage
                                </option>

                                <option value="WASTE">
                                    Waste
                                </option>

                                <option value="ELECTRICITY">
                                    Electricity
                                </option>
                            </select>
                        </div>

                        <div className="filter-actions">
                            <button
                                type="submit"
                                className="primary-button"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </div>
                    </form>

                    {/* =================================================
                        ERROR
                    ================================================== */}

                    {error && (
                        <div
                            className="issues-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    {/* =================================================
                        LOADING / EMPTY / TABLE
                    ================================================== */}

                    {loading ? (
                        <div className="issues-loading">
                            Loading issues...
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="issues-empty">
                            {getEmptyMessage()}
                        </div>
                    ) : (
                        <div className="issues-table-wrapper">
                            <table className="issues-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>

                                        {currentRole !==
                                            "CITIZEN" && (
                                            <th>
                                                Assigned Officer
                                            </th>
                                        )}

                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {issues.map(
                                        (issue) => (
                                            <tr
                                                key={
                                                    issue.id
                                                }
                                            >
                                                <td>
                                                    #
                                                    {
                                                        issue.id
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        issue.title
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        issue.category
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        issue.priority
                                                    }
                                                </td>

                                                <td>
                                                    <span
                                                        className={`status-badge status-${String(
                                                            issue.status ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {String(
                                                            issue.status ||
                                                                "-"
                                                        ).replaceAll(
                                                            "_",
                                                            " "
                                                        )}
                                                    </span>
                                                </td>

                                                {currentRole !==
                                                    "CITIZEN" && (
                                                    <td>
                                                        {issue.assignedToName ||
                                                            "Unassigned"}
                                                    </td>
                                                )}

                                                <td>
                                                    {formatDate(
                                                        issue.createdAt
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="issue-actions">

                                                        <button
                                                            type="button"
                                                            className="secondary-button"
                                                            onClick={() => {
                                                                setStatusError(
                                                                    ""
                                                                );

                                                                setRecurringIssues(
                                                                    []
                                                                );

                                                                setRecurringError(
                                                                    ""
                                                                );

                                                                setSelectedIssue(
                                                                    issue
                                                                );

                                                                if (
                                                                    currentRole !==
                                                                    "CITIZEN"
                                                                ) {
                                                                    loadRecurringIssues(
                                                                        issue.id
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            View
                                                        </button>

                                                        {currentRole ===
                                                            "ADMIN" && (
                                                            <button
                                                                type="button"
                                                                className="primary-button"
                                                                onClick={() =>
                                                                    openAssignModal(
                                                                        issue
                                                                    )
                                                                }
                                                                disabled={
                                                                    issue.status !==
                                                                    "VERIFIED"
                                                                }
                                                                title={
                                                                    issue.status !==
                                                                    "VERIFIED"
                                                                        ? "Only verified issues can be assigned"
                                                                        : "Assign to a department officer"
                                                                }
                                                            >
                                                                Assign
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

                    {/* =================================================
                        PAGINATION
                    ================================================== */}

                    {!loading &&
                        totalPages > 0 && (
                            <div className="pagination">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    disabled={page === 0}
                                    onClick={() =>
                                        setPage(
                                            page - 1
                                        )
                                    }
                                >
                                    Previous
                                </button>

                                <span>
                                    Page {page + 1} of{" "}
                                    {totalPages}
                                </span>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    disabled={
                                        page >=
                                        totalPages - 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            page + 1
                                        )
                                    }
                                >
                                    Next
                                </button>

                            </div>
                        )}
                </section>
            </main>

            {/* =====================================================
                CREATE ISSUE MODAL
            ====================================================== */}

            {showCreateModal &&
                currentRole === "CITIZEN" && (
                    <div
                        className="issue-modal-overlay"
                        onClick={closeCreateModal}
                    >
                        <div
                            className="issue-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="issue-modal-header">
                                <div>
                                    <h2>
                                        Report New Issue
                                    </h2>

                                    <p>
                                        Report a public
                                        infrastructure
                                        problem.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close-button"
                                    onClick={closeCreateModal}
                                    disabled={creatingIssue}
                                    aria-label="Close report issue dialog"
                                >
                                    ×
                                </button>
                            </div>

                            <form
                                onSubmit={
                                    handleCreateIssue
                                }
                            >

                                <div className="issue-modal-body">

                                    {createIssueError && (
                                        <div
                                            className="issues-error"
                                            role="alert"
                                        >
                                            {
                                                createIssueError
                                            }
                                        </div>
                                    )}

                                    <div className="filter-field">
                                        <label htmlFor="issue-title">
                                            Title
                                        </label>

                                        <input
                                            id="issue-title"
                                            name="title"
                                            type="text"
                                            value={
                                                issueForm.title
                                            }
                                            onChange={
                                                handleIssueFormChange
                                            }
                                            placeholder="Example: Large pothole near main road"
                                            maxLength={200}
                                            required
                                            disabled={
                                                creatingIssue
                                            }
                                        />
                                    </div>

                                    <div className="filter-field">
                                        <label htmlFor="issue-description">
                                            Description
                                        </label>

                                        <textarea
                                            id="issue-description"
                                            name="description"
                                            value={
                                                issueForm.description
                                            }
                                            onChange={
                                                handleIssueFormChange
                                            }
                                            placeholder="Describe the infrastructure problem..."
                                            rows={5}
                                            required
                                            disabled={
                                                creatingIssue
                                            }
                                        />
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "1fr 1fr",
                                            gap: "12px"
                                        }}
                                    >
                                        <div className="filter-field">
                                            <label htmlFor="issue-category">
                                                Category
                                            </label>

                                            <select
                                                id="issue-category"
                                                name="category"
                                                value={
                                                    issueForm.category
                                                }
                                                onChange={
                                                    handleIssueFormChange
                                                }
                                                required
                                                disabled={
                                                    creatingIssue
                                                }
                                            >
                                                <option value="">
                                                    Select category
                                                </option>

                                                <option value="ROADS">
                                                    Roads
                                                </option>

                                                <option value="STREETLIGHTS">
                                                    Streetlights
                                                </option>

                                                <option value="WATER">
                                                    Water
                                                </option>

                                                <option value="DRAINAGE">
                                                    Drainage
                                                </option>

                                                <option value="WASTE">
                                                    Waste
                                                </option>

                                                <option value="ELECTRICITY">
                                                    Electricity
                                                </option>
                                            </select>
                                        </div>

                                        <div className="filter-field">
                                            <label htmlFor="issue-priority">
                                                Priority
                                            </label>

                                            <select
                                                id="issue-priority"
                                                name="priority"
                                                value={
                                                    issueForm.priority
                                                }
                                                onChange={
                                                    handleIssueFormChange
                                                }
                                                required
                                                disabled={
                                                    creatingIssue
                                                }
                                            >
                                                <option value="">
                                                    Select priority
                                                </option>

                                                <option value="LOW">
                                                    Low
                                                </option>

                                                <option value="MEDIUM">
                                                    Medium
                                                </option>

                                                <option value="HIGH">
                                                    High
                                                </option>

                                                <option value="CRITICAL">
                                                    Critical
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "1fr 1fr",
                                            gap: "12px"
                                        }}
                                    >
                                        <div className="filter-field">
                                            <label htmlFor="issue-latitude">
                                                Latitude
                                            </label>

                                            <input
                                                id="issue-latitude"
                                                name="latitude"
                                                type="number"
                                                step="any"
                                                value={
                                                    issueForm.latitude
                                                }
                                                onChange={
                                                    handleIssueFormChange
                                                }
                                                placeholder="Example: 30.3398"
                                                required
                                                disabled={
                                                    creatingIssue
                                                }
                                            />
                                        </div>

                                        <div className="filter-field">
                                            <label htmlFor="issue-longitude">
                                                Longitude
                                            </label>

                                            <input
                                                id="issue-longitude"
                                                name="longitude"
                                                type="number"
                                                step="any"
                                                value={
                                                    issueForm.longitude
                                                }
                                                onChange={
                                                    handleIssueFormChange
                                                }
                                                placeholder="Example: 76.3869"
                                                required
                                                disabled={
                                                    creatingIssue
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="filter-field">
                                        <label htmlFor="issue-image">
                                            Evidence Photo
                                        </label>

                                        <input
                                            id="issue-image"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={
                                                handleImageChange
                                            }
                                            disabled={
                                                creatingIssue
                                            }
                                        />

                                        <small
                                            style={{
                                                display:
                                                    "block",
                                                marginTop:
                                                    "6px",
                                                opacity:
                                                    0.7
                                            }}
                                        >
                                            Optional. JPEG,
                                            PNG or WEBP.
                                            Maximum 5 MB.
                                        </small>
                                    </div>

                                    {imagePreview && (
                                        <div
                                            style={{
                                                marginTop:
                                                    "12px"
                                            }}
                                        >
                                            <p
                                                style={{
                                                    marginBottom:
                                                        "8px",
                                                    fontWeight:
                                                        "600"
                                                }}
                                            >
                                                Photo Preview
                                            </p>

                                            <img
                                                src={
                                                    imagePreview
                                                }
                                                alt="Evidence preview"
                                                style={{
                                                    display:
                                                        "block",
                                                    width:
                                                        "100%",
                                                    maxWidth:
                                                        "500px",
                                                    maxHeight:
                                                        "300px",
                                                    objectFit:
                                                        "contain",
                                                    borderRadius:
                                                        "10px",
                                                    border:
                                                        "1px solid #ddd",
                                                    margin:
                                                        "0 auto"
                                                }}
                                            />
                                        </div>
                                    )}

                                </div>

                                <div className="issue-modal-footer">

                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={
                                            closeCreateModal
                                        }
                                        disabled={
                                            creatingIssue
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            creatingIssue
                                        }
                                    >
                                        {creatingIssue
                                            ? "Reporting..."
                                            : "Report Issue"}
                                    </button>

                                </div>

                            </form>

                        </div>
                    </div>
                )}

            {/* =====================================================
                ISSUE DETAILS MODAL
            ====================================================== */}

            {selectedIssue && (
                <div
                    className="issue-modal-overlay"
                    onClick={closeIssueModal}
                >
                    <div
                        className="issue-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="issue-modal-header">
                            <div>
                                <h2>
                                    Issue #
                                    {
                                        selectedIssue.id
                                    }
                                </h2>

                                <p>
                                    Issue Details
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={
                                    closeIssueModal
                                }
                                aria-label="Close issue details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="issue-modal-body">

                            {/* =================================================
                                ISSUE INFORMATION
                            ================================================== */}

                            <div className="issue-detail-section">
                                <h3>
                                    Issue Information
                                </h3>

                                <div className="issue-detail-grid">

                                    <div>
                                        <span>
                                            Title
                                        </span>

                                        <strong>
                                            {
                                                selectedIssue.title ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Category
                                        </span>

                                        <strong>
                                            {
                                                selectedIssue.category ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Priority
                                        </span>

                                        <strong>
                                            {
                                                selectedIssue.priority ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            {String(
                                                selectedIssue.status ||
                                                    "-"
                                            ).replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Created
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedIssue.createdAt
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Assigned Officer
                                        </span>

                                        <strong>
                                            {selectedIssue.assignedToName ||
                                                "Unassigned"}
                                        </strong>
                                    </div>

                                    {currentRole !==
                                        "CITIZEN" && (
                                        <div>
                                            <span>
                                                Officer ID
                                            </span>

                                            <strong>
                                                {selectedIssue.assignedTo ??
                                                    "-"}
                                            </strong>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* =================================================
                                EVIDENCE PHOTO
                            ================================================== */}

                            <div className="issue-detail-section">
                                <h3>
                                    Evidence Photo
                                </h3>

                                {selectedIssue.imageUrl ? (
                                    <div
                                        style={{
                                            marginTop:
                                                "12px"
                                        }}
                                    >
                                        <img
                                            src={getImageUrl(
                                                selectedIssue.imageUrl
                                            )}
                                            alt={`Evidence for issue #${selectedIssue.id}`}
                                            style={{
                                                display:
                                                    "block",
                                                width:
                                                    "100%",
                                                maxWidth:
                                                    "600px",
                                                maxHeight:
                                                    "450px",
                                                objectFit:
                                                    "contain",
                                                borderRadius:
                                                    "10px",
                                                border:
                                                    "1px solid #ddd",
                                                margin:
                                                    "0 auto"
                                            }}
                                        />

                                        <div
                                            style={{
                                                textAlign:
                                                    "center",
                                                marginTop:
                                                    "10px"
                                            }}
                                        >
                                            <a
                                                href={getImageUrl(
                                                    selectedIssue.imageUrl
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open full-size
                                                evidence image
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p>
                                        No evidence photo
                                        was uploaded for
                                        this issue.
                                    </p>
                                )}
                            </div>

                            {/* =================================================
                                CIVIC MEMORY / RECURRING ISSUES
                            ================================================== */}

                            {currentRole !==
                                "CITIZEN" && (
                                <div className="issue-detail-section">

                                    <h3>
                                        Civic Memory & Prevention
                                    </h3>

                                    <p>
                                        Checking for previous
                                        reports in the same
                                        category within
                                        500 meters.
                                    </p>

                                    {recurringLoading && (
                                        <div className="issues-loading">
                                            Checking for
                                            recurring issues...
                                        </div>
                                    )}

                                    {recurringError && (
                                        <div
                                            className="issues-error"
                                            role="alert"
                                        >
                                            {recurringError}
                                        </div>
                                    )}

                                    {!recurringLoading &&
                                        !recurringError &&
                                        recurringIssues.length ===
                                            0 && (
                                            <div className="issues-success">
                                                ✓ No recurring
                                                issue detected
                                                near this report.
                                            </div>
                                        )}

                                    {!recurringLoading &&
                                        !recurringError &&
                                        recurringIssues.length >
                                            0 && (
                                            <>

                                                <div
                                                    className="issues-error"
                                                    role="alert"
                                                >
                                                    ⚠ Recurring
                                                    issue
                                                    detected:
                                                    {" "}
                                                    {
                                                        recurringIssues.length
                                                    }{" "}
                                                    related
                                                    report
                                                    {recurringIssues.length ===
                                                    1
                                                        ? ""
                                                        : "s"}{" "}
                                                    found nearby.
                                                </div>

                                                <div
                                                    className="recurring-issues-list"
                                                    style={{
                                                        marginTop:
                                                            "12px"
                                                    }}
                                                >
                                                    {recurringIssues.map(
                                                        (
                                                            recurringIssue
                                                        ) => (
                                                            <div
                                                                key={
                                                                    recurringIssue.issueId
                                                                }
                                                                className="issue-detail-section"
                                                                style={{
                                                                    marginBottom:
                                                                        "10px"
                                                                }}
                                                            >

                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        gap:
                                                                            "12px"
                                                                    }}
                                                                >

                                                                    <strong>
                                                                        #
                                                                        {
                                                                            recurringIssue.issueId
                                                                        }{" "}
                                                                        —{" "}
                                                                        {
                                                                            recurringIssue.title
                                                                        }
                                                                    </strong>

                                                                    <span
                                                                        className={`status-badge status-${String(
                                                                            recurringIssue.status ||
                                                                                ""
                                                                        ).toLowerCase()}`}
                                                                    >
                                                                        {String(
                                                                            recurringIssue.status ||
                                                                                "-"
                                                                        ).replaceAll(
                                                                            "_",
                                                                            " "
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                <p
                                                                    style={{
                                                                        margin:
                                                                            "6px 0 0"
                                                                    }}
                                                                >
                                                                    <strong>
                                                                        Category:
                                                                    </strong>{" "}
                                                                    {
                                                                        recurringIssue.category
                                                                    }

                                                                    {" • "}

                                                                    <strong>
                                                                        Distance:
                                                                    </strong>{" "}
                                                                    {formatDistance(
                                                                        recurringIssue.distanceMeters
                                                                    )}

                                                                    {" • "}

                                                                    <strong>
                                                                        Reported:
                                                                    </strong>{" "}
                                                                    {formatDate(
                                                                        recurringIssue.createdAt
                                                                    )}
                                                                </p>

                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                            </>
                                        )}

                                </div>
                            )}

                            {/* =================================================
                                STATUS UPDATE
                            ================================================== */}

                            {getNextStatus(
                                selectedIssue
                            ) && (
                                <div className="issue-detail-section status-update-section">

                                    <h3>
                                        Update Status
                                    </h3>

                                    <p>
                                        You can move this
                                        issue to{" "}
                                        <strong>
                                            {getNextStatus(
                                                selectedIssue
                                            ).replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </strong>
                                        .
                                    </p>

                                    {statusError && (
                                        <div
                                            className="issues-error"
                                            role="alert"
                                        >
                                            {statusError}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={
                                            handleStatusUpdate
                                        }
                                        disabled={
                                            statusUpdating
                                        }
                                    >
                                        {statusUpdating
                                            ? "Updating..."
                                            : `Mark as ${getNextStatus(
                                                  selectedIssue
                                              ).replaceAll(
                                                  "_",
                                                  " "
                                              )}`}
                                    </button>

                                </div>
                            )}

                            {/* =================================================
                                DESCRIPTION
                            ================================================== */}

                            <div className="issue-detail-section">

                                <h3>
                                    Description
                                </h3>

                                <p className="issue-description">
                                    {selectedIssue.description ||
                                        "No description provided."}
                                </p>

                            </div>

                            {/* =================================================
                                LOCATION
                            ================================================== */}

                            <div className="issue-detail-section">

                                <h3>
                                    Location
                                </h3>

                                <div className="issue-location">

                                    <div>
                                        <span>
                                            Latitude
                                        </span>

                                        <strong>
                                            {selectedIssue.latitude ??
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Longitude
                                        </span>

                                        <strong>
                                            {selectedIssue.longitude ??
                                                "-"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="issue-modal-footer">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    closeIssueModal
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* =====================================================
                ASSIGNMENT MODAL
            ====================================================== */}

            {assigningIssue &&
                currentRole === "ADMIN" && (
                    <div
                        className="issue-modal-overlay"
                        onClick={
                            closeAssignModal
                        }
                    >

                        <div
                            className="issue-modal assign-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="issue-modal-header">

                                <div>
                                    <h2>
                                        Assign Issue #
                                        {
                                            assigningIssue.id
                                        }
                                    </h2>

                                    <p>
                                        Assign this
                                        verified issue
                                        to a department
                                        officer.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close-button"
                                    onClick={
                                        closeAssignModal
                                    }
                                    disabled={
                                        assigning
                                    }
                                    aria-label="Close assignment dialog"
                                >
                                    ×
                                </button>

                            </div>

                            <form
                                onSubmit={
                                    handleAssign
                                }
                            >

                                <div className="issue-modal-body">

                                    <div className="assignment-info">

                                        <span>
                                            Current status
                                        </span>

                                        <strong>
                                            {String(
                                                assigningIssue.status ||
                                                    "-"
                                            ).replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </strong>

                                    </div>

                                    <div className="filter-field assignment-field">

                                        <label htmlFor="assigned-officer">
                                            Select Department
                                            Officer
                                        </label>

                                        <select
                                            id="assigned-officer"
                                            value={
                                                assignedTo
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setAssignedTo(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            required
                                            disabled={
                                                officersLoading ||
                                                officers.length ===
                                                    0 ||
                                                assigning
                                            }
                                        >

                                            <option value="">
                                                {officersLoading
                                                    ? "Loading officers..."
                                                    : officers.length ===
                                                        0
                                                      ? "No department officers available"
                                                      : "Choose an officer"}
                                            </option>

                                            {officers.map(
                                                (
                                                    officer
                                                ) => (
                                                    <option
                                                        key={
                                                            officer.id
                                                        }
                                                        value={
                                                            officer.id
                                                        }
                                                    >
                                                        {
                                                            officer.name
                                                        }{" "}
                                                        —{" "}
                                                        {
                                                            officer.email
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    {assignError && (
                                        <div
                                            className="issues-error"
                                            role="alert"
                                        >
                                            {
                                                assignError
                                            }
                                        </div>
                                    )}

                                </div>

                                <div className="issue-modal-footer">

                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={
                                            closeAssignModal
                                        }
                                        disabled={
                                            assigning
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            assigning ||
                                            officersLoading ||
                                            !assignedTo
                                        }
                                    >
                                        {assigning
                                            ? "Assigning..."
                                            : "Assign Issue"}
                                    </button>

                                </div>

                            </form>

                        </div>
                    </div>
                )}

        </div>
    );
}

export default Issues;