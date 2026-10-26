import { useEffect, useState } from "react";
import api from "../api/axios";
import {
    translateStatus,
    useLocale,
} from "../i18n/LocaleContext";

function handleDialogKeyDown(event, onClose, isBusy = false) {
    if (event.key === "Escape") {
        event.preventDefault();
        if (!isBusy) onClose();
        return;
    }

    if (event.key !== "Tab") return;

    const dialog = event.currentTarget.querySelector(".issue-modal");
    const focusable = dialog?.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable?.length) {
        event.preventDefault();
        dialog?.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function Issues() {
    const { locale, t } = useLocale();
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [issueHistory, setIssueHistory] = useState([]);
    const [issueHistoryLoading, setIssueHistoryLoading] = useState(false);
    const [issueHistoryError, setIssueHistoryError] = useState("");
    const [assigningIssue, setAssigningIssue] = useState(null);

    const [officers, setOfficers] = useState([]);
    const [officersLoading, setOfficersLoading] = useState(false);

    const [assignedTo, setAssignedTo] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState("");

    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusError, setStatusError] = useState("");
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [requestReopen, setRequestReopen] = useState(false);
    const [reopenRequestMessage, setReopenRequestMessage] = useState("");
    const [feedbackSaving, setFeedbackSaving] = useState(false);
    const [feedbackError, setFeedbackError] = useState("");
    const [reviewingReopen, setReviewingReopen] = useState(false);
    const [reopenReviewError, setReopenReviewError] = useState("");

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
                t(err.response?.data?.message || "Unable to load issues.")
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
                t(err.response?.data?.message || "Unable to load issues.")
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
                t("Only JPEG, PNG and WEBP images are allowed.")
            );

            event.target.value = "";
            setImageFile(null);
            setImagePreview("");
            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            setCreateIssueError(
                t("Image size cannot exceed 5 MB.")
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
                t("Please enter an issue title.")
            );
            return;
        }

        if (!description) {
            setCreateIssueError(
                t("Please enter an issue description.")
            );
            return;
        }

        if (!issueForm.category) {
            setCreateIssueError(
                t("Please select an issue category.")
            );
            return;
        }

        if (!issueForm.priority) {
            setCreateIssueError(
                t("Please select an issue priority.")
            );
            return;
        }

        if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {
            setCreateIssueError(
                t("Please enter a valid latitude between -90 and 90.")
            );
            return;
        }

        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            setCreateIssueError(
                t("Please enter a valid longitude between -180 and 180.")
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
                locale === "hi"
                    ? `समस्या #${createdIssue.id} सफलतापूर्वक दर्ज की गई।`
                    : `Issue #${createdIssue.id} was reported successfully.`
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
                t(
                    err.response?.data?.message ||
                        "Unable to report this issue. Please try again."
                )
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
                t(
                    err.response?.data?.message ||
                        "Unable to check for recurring issues."
                )
            );
        } finally {
            setRecurringLoading(false);
        }
    };

    const loadIssueHistory = async (issueId) => {
        setIssueHistoryLoading(true);
        setIssueHistoryError("");

        try {
            const response = await api.get(
                `/issues/${issueId}/history`,
                {
                    headers: getAuthHeaders()
                }
            );

            setIssueHistory(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (err) {
            console.error("Issue history loading error:", err);
            setIssueHistoryError(
                err.response?.data?.message ||
                    t("Unable to load this issue's progress history.")
            );
            setIssueHistory([]);
        } finally {
            setIssueHistoryLoading(false);
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
        setIssueHistory([]);
        setIssueHistoryError("");
        setRecurringIssues([]);
        setRecurringError("");
        setRecurringLoading(false);
        setStatusError("");
        setFeedbackError("");
        setReopenReviewError("");
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
                t(
                    err.response?.data?.message ||
                        "Unable to load department officers."
                )
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
            : parsedDate.toLocaleString(locale === "hi" ? "hi-IN" : "en-IN");
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

    const activeDialog = showCreateModal
        ? "create"
        : assigningIssue
          ? "assign"
          : selectedIssue
            ? "details"
            : null;

    useEffect(() => {
        if (!activeDialog) return undefined;

        const previouslyFocused = document.activeElement;
        const dialog = document.querySelector(
            ".issue-modal-overlay .issue-modal"
        );
        const firstFocusable = dialog?.querySelector(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]'
        );

        if (firstFocusable instanceof HTMLElement) {
            firstFocusable.focus();
        } else if (dialog instanceof HTMLElement) {
            dialog.focus();
        }

        return () => {
            if (
                previouslyFocused instanceof HTMLElement &&
                document.contains(previouslyFocused)
            ) {
                previouslyFocused.focus();
            }
        };
    }, [activeDialog]);

    const handleAssign = async (event) => {
        event.preventDefault();

        const officerId = Number(assignedTo);

        if (
            !Number.isInteger(officerId) ||
            officerId <= 0
        ) {
            setAssignError(
                t("Please select a valid department officer.")
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

            if (selectedIssue?.id === updatedIssue.id) {
                await loadIssueHistory(updatedIssue.id);
            }

            setAssigningIssue(null);
            setAssignedTo("");

            setSuccess(
                locale === "hi"
                    ? `समस्या #${updatedIssue.id} सफलतापूर्वक आवंटित की गई।`
                    : `Issue #${updatedIssue.id} was assigned successfully.`
            );

            await loadIssues();
        } catch (err) {
            console.error(
                "Issue assignment error:",
                err
            );

            setAssignError(
                t(
                    err.response?.data?.message ||
                        "Unable to assign this issue. Please try again."
                )
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
            await loadIssueHistory(updatedIssue.id);

            setIssues((currentIssues) =>
                currentIssues.map((issue) =>
                    issue.id === updatedIssue.id
                        ? updatedIssue
                        : issue
                )
            );

            setSuccess(
                locale === "hi"
                    ? `समस्या #${updatedIssue.id} की स्थिति ${translateStatus(locale, nextStatus)} कर दी गई।`
                    : `Issue #${updatedIssue.id} status changed to ${nextStatus.replaceAll("_", " ")}.`
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
                t(
                    err.response?.data?.message ||
                        "Unable to update this issue's status. Please try again."
                )
            );
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleFeedbackSubmit = async (event) => {
        event.preventDefault();
        if (!selectedIssue || feedbackSaving) return;

        setFeedbackSaving(true);
        setFeedbackError("");
        setSuccess("");
        try {
            const response = await api.post(
                `/issues/${selectedIssue.id}/feedback`,
                {
                    rating: feedbackRating,
                    comment: feedbackComment,
                    requestReopen,
                    reopenRequestMessage,
                },
                { headers: getAuthHeaders() }
            );
            const updatedIssue = response.data;
            setSelectedIssue(updatedIssue);
            setIssues((currentIssues) =>
                currentIssues.map((issue) =>
                    issue.id === updatedIssue.id ? updatedIssue : issue
                )
            );
            setSuccess(t("Thank you for sharing your feedback."));
        } catch (err) {
            console.error("Issue feedback submission error:", err);
            setFeedbackError(
                t(
                    err.response?.data?.message ||
                        "Unable to submit feedback. Please try again."
                )
            );
        } finally {
            setFeedbackSaving(false);
        }
    };

    const handleReopenReview = async (approved) => {
        if (!selectedIssue || reviewingReopen) return;

        setReviewingReopen(true);
        setReopenReviewError("");
        setSuccess("");
        try {
            const response = await api.patch(
                `/issues/${selectedIssue.id}/reopen-request`,
                { approved },
                { headers: getAuthHeaders() }
            );
            const updatedIssue = response.data;
            setSelectedIssue(updatedIssue);
            setIssues((currentIssues) =>
                currentIssues.map((issue) =>
                    issue.id === updatedIssue.id ? updatedIssue : issue
                )
            );
            if (approved) {
                await loadIssueHistory(updatedIssue.id);
            }
            setSuccess(
                approved
                    ? t("Reopen request approved. The issue is back in progress.")
                    : t("Reopen request declined.")
            );
            await loadIssues();
        } catch (err) {
            console.error("Reopen request review error:", err);
            setReopenReviewError(
                t(
                    err.response?.data?.message ||
                        "Unable to review this reopen request. Please try again."
                )
            );
        } finally {
            setReviewingReopen(false);
        }
    };

    // =========================================================
    // ROLE TEXT
    // =========================================================

    const getRoleTitle = () => {
        if (currentRole === "DEPARTMENT") {
            return t("My Assigned Issues");
        }

        if (currentRole === "CITIZEN") {
            return t("My Reported Issues");
        }

        return t("Issue Management");
    };

    const getRoleDescription = () => {
        if (currentRole === "DEPARTMENT") {
            return t("View and update public infrastructure issues assigned to you.");
        }

        if (currentRole === "CITIZEN") {
            return t("View, search and track the infrastructure issues you have reported.");
        }

        return t("View, search, filter and assign public infrastructure issues.");
    };

    const getIssuesCardTitle = () => {
        if (currentRole === "DEPARTMENT") {
            return t("Assigned to Me");
        }

        if (currentRole === "CITIZEN") {
            return t("My Reports");
        }

        return t("Issues");
    };

    const getEmptyMessage = () => {
        if (currentRole === "DEPARTMENT") {
            return t("No issues are currently assigned to you.");
        }

        if (currentRole === "CITIZEN") {
            return t("You have not reported any issues yet.");
        }

        return t("No issues found.");
    };

    return (
        <div className="issues-page">

            {/* =================================================
                HEADER
            ================================================== */}


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
                                {t("+ Report New Issue")}
                            </button>
                        )}

                        <button
                            className="secondary-button"
                            onClick={() => {
                                window.location.href = "/";
                            }}
                        >
                            {t("← Dashboard")}
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
                            aria-label={t("Dismiss success message")}
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
                                {locale === "hi"
                                    ? `${totalElements} समस्याएँ मिलीं`
                                    : `${totalElements} issue${totalElements === 1 ? "" : "s"} found`}
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
                                {t("Search")}
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
                                placeholder={t("Search title or description")}
                            />
                        </div>

                        <div className="filter-field">
                            <label htmlFor="status">
                                {t("Status")}
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
                                    {t("All Statuses")}
                                </option>

                                <option value="REPORTED">
                                    {t("Reported")}
                                </option>

                                <option value="VERIFIED">
                                    {t("Verified")}
                                </option>

                                <option value="ASSIGNED">
                                    {t("Assigned")}
                                </option>

                                <option value="IN_PROGRESS">
                                    {t("In Progress")}
                                </option>

                                <option value="RESOLVED">
                                    {t("Resolved")}
                                </option>
                            </select>
                        </div>

                        <div className="filter-field">
                            <label htmlFor="priority">
                                {t("Priority")}
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
                                    {t("All Priorities")}
                                </option>

                                <option value="LOW">
                                    {t("Low")}
                                </option>

                                <option value="MEDIUM">
                                    {t("Medium")}
                                </option>

                                <option value="HIGH">
                                    {t("High")}
                                </option>

                                <option value="CRITICAL">
                                    {t("Critical")}
                                </option>
                            </select>
                        </div>

                        <div className="filter-field">
                            <label htmlFor="category">
                                {t("Category")}
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
                                    {t("All Categories")}
                                </option>

                                <option value="ROADS">
                                    {t("Roads")}
                                </option>

                                <option value="STREETLIGHTS">
                                    {t("Streetlights")}
                                </option>

                                <option value="WATER">
                                    {t("Water")}
                                </option>

                                <option value="DRAINAGE">
                                    {t("Drainage")}
                                </option>

                                <option value="WASTE">
                                    {t("Waste")}
                                </option>

                                <option value="ELECTRICITY">
                                    {t("Electricity")}
                                </option>
                            </select>
                        </div>

                        <div className="filter-actions">
                            <button
                                type="submit"
                                className="primary-button"
                            >
                                {t("Search")}
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleClearFilters}
                            >
                                {t("Clear")}
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
                            {t("Loading issues...")}
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="issues-empty">
                            {getEmptyMessage()}
                        </div>
                    ) : (
                        <div
                            className="issues-table-wrapper"
                            role="region"
                            aria-label={t("Issue list")}
                            tabIndex="0"
                        >
                            <table className="issues-table">
                                <thead>
                                    <tr>
                                        <th scope="col">ID</th>
                                        <th scope="col">{t("Title")}</th>
                                        <th scope="col">{t("Category")}</th>
                                        <th scope="col">{t("Priority")}</th>
                                        <th scope="col">{t("Status")}</th>

                                        {currentRole !==
                                            "CITIZEN" && (
                                            <th scope="col">
                                                {t("Assigned Officer")}
                                            </th>
                                        )}

                                        <th scope="col">{t("Created")}</th>
                                        <th scope="col">{t("Actions")}</th>
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
                                                    {translateStatus(locale, issue.category)}
                                                </td>

                                                <td>
                                                    {translateStatus(locale, issue.priority)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`status-badge status-${String(
                                                            issue.status ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {translateStatus(locale, issue.status)}
                                                    </span>
                                                    {currentRole !== "CITIZEN" &&
                                                        issue.reopenRequestStatus === "PENDING" && (
                                                            <span className="issue-reopen-badge">
                                                                {t("Reopen requested")}
                                                            </span>
                                                        )}
                                                </td>

                                                {currentRole !==
                                                    "CITIZEN" && (
                                                    <td>
                                                        {issue.assignedToName ||
                                                            t("Unassigned")}
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

                                                                setIssueHistory(
                                                                    []
                                                                );
                                                                setFeedbackRating(
                                                                    issue.citizenRating || 0
                                                                );
                                                                setFeedbackComment(
                                                                    issue.citizenFeedback || ""
                                                                );
                                                                setRequestReopen(false);
                                                                setReopenRequestMessage("");
                                                                setFeedbackError("");
                                                                setReopenReviewError("");

                                                                loadIssueHistory(
                                                                    issue.id
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
                                                            {t("View")}
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
                                                                        ? t("Only verified issues can be assigned")
                                                                        : t("Assign to a department officer")
                                                                }
                                                            >
                                                                {t("Assign")}
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
                                    {t("Previous")}
                                </button>

                                <span>
                                    {locale === "hi"
                                        ? `पृष्ठ ${page + 1} / ${totalPages}`
                                        : `Page ${page + 1} of ${totalPages}`}
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
                                    {t("Next")}
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
                        onKeyDown={(event) =>
                            handleDialogKeyDown(
                                event,
                                closeCreateModal,
                                creatingIssue
                            )
                        }
                    >
                        <div
                            className="issue-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="issue-report-dialog-title"
                            tabIndex="-1"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="issue-modal-header">
                                <div>
                                    <h2 id="issue-report-dialog-title">
                                        {t("Report New Issue")}
                                    </h2>

                                    <p>
                                        {t("Report a public infrastructure problem.")}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close-button"
                                    onClick={closeCreateModal}
                                    disabled={creatingIssue}
                                    aria-label={t("Close report issue dialog")}
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
                                            {t("Title")}
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
                                            placeholder={t("Example: Large pothole near main road")}
                                            maxLength={200}
                                            required
                                            disabled={
                                                creatingIssue
                                            }
                                        />
                                    </div>

                                    <div className="filter-field">
                                        <label htmlFor="issue-description">
                                            {t("Description")}
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
                                            placeholder={t("Describe the infrastructure problem...")}
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
                                                {t("Category")}
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
                                                    {t("Select category")}
                                                </option>

                                                <option value="ROADS">
                                                    {t("Roads")}
                                                </option>

                                                <option value="STREETLIGHTS">
                                                    {t("Streetlights")}
                                                </option>

                                                <option value="WATER">
                                                    {t("Water")}
                                                </option>

                                                <option value="DRAINAGE">
                                                    {t("Drainage")}
                                                </option>

                                                <option value="WASTE">
                                                    {t("Waste")}
                                                </option>

                                                <option value="ELECTRICITY">
                                                    {t("Electricity")}
                                                </option>
                                            </select>
                                        </div>

                                        <div className="filter-field">
                                            <label htmlFor="issue-priority">
                                                {t("Priority")}
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
                                                    {t("Select priority")}
                                                </option>

                                                <option value="LOW">
                                                    {t("Low")}
                                                </option>

                                                <option value="MEDIUM">
                                                    {t("Medium")}
                                                </option>

                                                <option value="HIGH">
                                                    {t("High")}
                                                </option>

                                                <option value="CRITICAL">
                                                    {t("Critical")}
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
                                                {t("Latitude")}
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
                                                placeholder={
                                                    locale === "hi"
                                                        ? "उदाहरण: 30.3398"
                                                        : "Example: 30.3398"
                                                }
                                                required
                                                disabled={
                                                    creatingIssue
                                                }
                                            />
                                        </div>

                                        <div className="filter-field">
                                            <label htmlFor="issue-longitude">
                                                {t("Longitude")}
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
                                                placeholder={
                                                    locale === "hi"
                                                        ? "उदाहरण: 76.3869"
                                                        : "Example: 76.3869"
                                                }
                                                required
                                                disabled={
                                                    creatingIssue
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="filter-field">
                                        <label htmlFor="issue-image">
                                            {t("Evidence Photo")}
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
                                            {t("Optional. JPEG, PNG or WEBP. Maximum 5 MB.")}
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
                                                {t("Photo Preview")}
                                            </p>

                                            <img
                                                src={
                                                    imagePreview
                                                }
                                                alt={t("Evidence preview")}
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
                                        {t("Cancel")}
                                    </button>

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            creatingIssue
                                        }
                                    >
                                        {creatingIssue
                                            ? t("Reporting...")
                                            : t("Report Issue")}
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
                    onKeyDown={(event) =>
                        handleDialogKeyDown(event, closeIssueModal)
                    }
                >
                <div
                    className="issue-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="issue-details-dialog-title"
                    tabIndex="-1"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                    >

                        <div className="issue-modal-header">
                            <div>
                                <h2 id="issue-details-dialog-title">
                                    {t("Issue #")} #
                                    {
                                        selectedIssue.id
                                    }
                                </h2>

                                <p>{t("Issue Details")}</p>
                            </div>

                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={
                                    closeIssueModal
                                }
                                aria-label={t("Close issue details")}
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
                                    {t("Issue Information")}
                                </h3>

                                <div className="issue-detail-grid">

                                    <div>
                                        <span>
                                            {t("Title")}
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
                                            {t("Category")}
                                        </span>

                                        <strong>
                                            {selectedIssue.category
                                                ? translateStatus(
                                                      locale,
                                                      selectedIssue.category
                                                  )
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            {t("Priority")}
                                        </span>

                                        <strong>
                                            {selectedIssue.priority
                                                ? translateStatus(
                                                      locale,
                                                      selectedIssue.priority
                                                  )
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            {t("Status")}
                                        </span>

                                        <strong>
                                            {translateStatus(
                                                locale,
                                                selectedIssue.status
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            {t("Created")}
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedIssue.createdAt
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            {t("Assigned Officer")}
                                        </span>

                                        <strong>
                                            {selectedIssue.assignedToName ||
                                                t("Unassigned")}
                                        </strong>
                                    </div>

                                    {currentRole !==
                                        "CITIZEN" && (
                                        <div>
                                            <span>
                                                {t("Officer ID")}
                                            </span>

                                            <strong>
                                                {selectedIssue.assignedTo ??
                                                    "-"}
                                            </strong>
                                        </div>
                                    )}

                                </div>
                            </div>

                            <section
                                className="issue-detail-section issue-timeline-section"
                                aria-labelledby="issue-timeline-title"
                            >
                                <div className="issue-timeline-heading">
                                    <div>
                                        <h3 id="issue-timeline-title">
                                            {t("Progress timeline")}
                                        </h3>
                                        <p>
                                            {t("Follow each recorded update from report to resolution.")}
                                        </p>
                                    </div>
                                    <span className="issue-current-status">
                                        {translateStatus(
                                            locale,
                                            selectedIssue.status
                                        )}
                                    </span>
                                </div>

                                {selectedIssue.assignedToName && (
                                    <p className="issue-timeline-assignee">
                                        {t("Currently assigned to")}{" "}
                                        <strong>
                                            {selectedIssue.assignedToName}
                                        </strong>
                                    </p>
                                )}

                                {issueHistoryLoading ? (
                                    <p
                                        className="issue-timeline-message"
                                        role="status"
                                    >
                                        {t("Loading progress history...")}
                                    </p>
                                ) : issueHistoryError ? (
                                    <div
                                        className="issue-timeline-error"
                                        role="alert"
                                    >
                                        <span>{issueHistoryError}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                loadIssueHistory(selectedIssue.id)
                                            }
                                        >
                                            {t("Retry")}
                                        </button>
                                    </div>
                                ) : issueHistory.length === 0 ? (
                                    <p className="issue-timeline-message">
                                        {t("No status updates have been recorded yet.")}
                                    </p>
                                ) : (
                                    <ol className="issue-timeline">
                                        {issueHistory.map((entry, index) => (
                                            <li
                                                className={`issue-timeline-item ${
                                                    index ===
                                                    issueHistory.length - 1
                                                        ? "current"
                                                        : ""
                                                }`}
                                                key={`${entry.status}-${entry.changedAt}-${index}`}
                                            >
                                                <span
                                                    className="issue-timeline-marker"
                                                    aria-hidden="true"
                                                />
                                                <div className="issue-timeline-event">
                                                    <strong>
                                                        {translateStatus(
                                                            locale,
                                                            entry.status
                                                        )}
                                                    </strong>
                                                    <time
                                                        dateTime={
                                                            entry.changedAt ||
                                                            undefined
                                                        }
                                                    >
                                                        {formatDate(
                                                            entry.changedAt
                                                        )}
                                                    </time>
                                                    <span>
                                                        {t("Updated by")}{" "}
                                                        {entry.changedByName ||
                                                            (entry.changedBy
                                                                ? `User #${entry.changedBy}`
                                                                : t("CivicOS"))}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </section>

                            {currentRole === "CITIZEN" &&
                                selectedIssue.status === "RESOLVED" && (
                                    <section
                                        className="issue-detail-section issue-feedback-section"
                                        aria-labelledby="issue-feedback-title"
                                    >
                                        <h3 id="issue-feedback-title">
                                            {t("How was this issue resolved?")}
                                        </h3>
                                        {selectedIssue.feedbackSubmittedAt &&
                                        selectedIssue.reopenRequestStatus !== "DECLINED" ? (
                                            <div className="issue-feedback-submitted">
                                                <p>
                                                    {t("Your feedback")}
                                                    {selectedIssue.citizenRating
                                                        ? ` · ${selectedIssue.citizenRating}/5`
                                                        : ""}
                                                </p>
                                                {selectedIssue.citizenFeedback && (
                                                    <blockquote>
                                                        {selectedIssue.citizenFeedback}
                                                    </blockquote>
                                                )}
                                                {selectedIssue.reopenRequestStatus && (
                                                    <p role="status">
                                                        {t("Reopen request")}:{" "}
                                                        {translateStatus(
                                                            locale,
                                                            selectedIssue.reopenRequestStatus
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <form onSubmit={handleFeedbackSubmit}>
                                                {selectedIssue.reopenRequestStatus === "DECLINED" && (
                                                    <p className="issue-reopen-decision" role="status">
                                                        {t("Your reopen request was declined. You can update your feedback and submit another request.")}
                                                    </p>
                                                )}
                                                <p>
                                                    {t("Rate the completed work and optionally ask for a review if the issue remains unresolved.")}
                                                </p>
                                                <fieldset
                                                    className="issue-rating"
                                                    disabled={feedbackSaving}
                                                >
                                                    <legend>{t("Your rating")}</legend>
                                                    <div>
                                                        {[1, 2, 3, 4, 5].map((rating) => (
                                                            <button
                                                                key={rating}
                                                                type="button"
                                                                className={
                                                                    rating <= feedbackRating
                                                                        ? "issue-rating-star selected"
                                                                        : "issue-rating-star"
                                                                }
                                                                aria-label={`${rating} ${t("stars")}`}
                                                                aria-pressed={feedbackRating === rating}
                                                                onClick={() => setFeedbackRating(rating)}
                                                            >
                                                                ★
                                                            </button>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                                <div className="filter-field">
                                                    <label htmlFor="issue-feedback-comment">
                                                        {t("Optional comment")}
                                                    </label>
                                                    <textarea
                                                        id="issue-feedback-comment"
                                                        value={feedbackComment}
                                                        maxLength={2000}
                                                        rows={3}
                                                        onChange={(event) =>
                                                            setFeedbackComment(event.target.value)
                                                        }
                                                        disabled={feedbackSaving}
                                                    />
                                                </div>
                                                <label className="issue-reopen-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={requestReopen}
                                                        onChange={(event) =>
                                                            setRequestReopen(event.target.checked)
                                                        }
                                                        disabled={
                                                            feedbackSaving ||
                                                            selectedIssue.reopenRequestStatus === "PENDING"
                                                        }
                                                    />
                                                    <span>{t("Ask staff to review and reopen this issue")}</span>
                                                </label>
                                                {requestReopen && (
                                                    <div className="filter-field">
                                                        <label htmlFor="reopen-request-message">
                                                            {t("Why does this issue need more work?")}
                                                        </label>
                                                        <textarea
                                                            id="reopen-request-message"
                                                            value={reopenRequestMessage}
                                                            maxLength={1000}
                                                            rows={2}
                                                            onChange={(event) =>
                                                                setReopenRequestMessage(event.target.value)
                                                            }
                                                            disabled={feedbackSaving}
                                                        />
                                                    </div>
                                                )}
                                                {feedbackError && (
                                                    <div className="issues-error" role="alert">
                                                        {feedbackError}
                                                    </div>
                                                )}
                                                <button
                                                    type="submit"
                                                    className="primary-button"
                                                    disabled={feedbackSaving || feedbackRating < 1}
                                                >
                                                    {feedbackSaving
                                                        ? t("Submitting...")
                                                        : t("Submit feedback")}
                                                </button>
                                            </form>
                                        )}
                                    </section>
                                )}

                            {currentRole !== "CITIZEN" &&
                                (selectedIssue.reopenRequestStatus ||
                                    selectedIssue.citizenRating ||
                                    selectedIssue.citizenFeedback) && (
                                    <section
                                        className="issue-detail-section issue-feedback-section"
                                        aria-labelledby="reopen-review-title"
                                    >
                                        <h3 id="reopen-review-title">
                                            {t("Citizen feedback")}
                                        </h3>
                                        {selectedIssue.citizenRating && (
                                            <p>
                                                {t("Rating")}: {selectedIssue.citizenRating}/5
                                            </p>
                                        )}
                                        {selectedIssue.citizenFeedback && (
                                            <blockquote>{selectedIssue.citizenFeedback}</blockquote>
                                        )}
                                        <p>
                                            {t("Reopen request")}:{" "}
                                            <strong>
                                                {translateStatus(
                                                    locale,
                                                    selectedIssue.reopenRequestStatus
                                                )}
                                            </strong>
                                        </p>
                                        {selectedIssue.reopenRequestMessage && (
                                            <blockquote>
                                                {selectedIssue.reopenRequestMessage}
                                            </blockquote>
                                        )}
                                        {selectedIssue.reopenRequestStatus === "PENDING" && (
                                            <>
                                                {reopenReviewError && (
                                                    <div className="issues-error" role="alert">
                                                        {reopenReviewError}
                                                    </div>
                                                )}
                                                <div className="issue-reopen-actions">
                                                    <button
                                                        type="button"
                                                        className="primary-button"
                                                        disabled={reviewingReopen}
                                                        onClick={() => handleReopenReview(true)}
                                                    >
                                                        {reviewingReopen
                                                            ? t("Saving...")
                                                            : t("Approve and reopen")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="secondary-button"
                                                        disabled={reviewingReopen}
                                                        onClick={() => handleReopenReview(false)}
                                                    >
                                                        {t("Decline request")}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </section>
                                )}

                            {/* =================================================
                                EVIDENCE PHOTO
                            ================================================== */}

                            <div className="issue-detail-section">
                                <h3>
                                    {t("Evidence Photo")}
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
                                            alt={
                                                locale === "hi"
                                                    ? `समस्या #${selectedIssue.id} का साक्ष्य`
                                                    : `Evidence for issue #${selectedIssue.id}`
                                            }
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
                                                {t("Open full-size evidence image")}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p>
                                        {t("No evidence photo was uploaded for this issue.")}
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
                                        {t("Civic Memory & Prevention")}
                                    </h3>

                                    <p>
                                        {t("Checking for previous reports in the same category within 500 meters.")}
                                    </p>

                                    {recurringLoading && (
                                        <div className="issues-loading">
                                            {t("Checking for recurring issues...")}
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
                                                ✓ {t("No recurring issue detected near this report.")}
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
                                                    {locale === "hi"
                                                        ? `⚠ पास में ${recurringIssues.length} संबंधित समस्या रिपोर्ट मिलीं।`
                                                        : `⚠ Recurring issue detected: ${recurringIssues.length} related report${recurringIssues.length === 1 ? "" : "s"} found nearby.`}
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
                                                                        {translateStatus(
                                                                            locale,
                                                                            recurringIssue.status
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
                                                                        {t("Category")}:
                                                                    </strong>{" "}
                                                                    {
                                                                        translateStatus(
                                                                            locale,
                                                                            recurringIssue.category
                                                                        )
                                                                    }

                                                                    {" • "}

                                                                    <strong>
                                                                        {t("Distance")}:
                                                                    </strong>{" "}
                                                                    {formatDistance(
                                                                        recurringIssue.distanceMeters
                                                                    )}

                                                                    {" • "}

                                                                    <strong>
                                                                        {t("Reported")}:
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
                                        {t("Update Status")}
                                    </h3>

                                    <p>
                                        {t("You can move this issue to")}{" "}
                                        <strong>
                                            {translateStatus(
                                                locale,
                                                getNextStatus(selectedIssue)
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
                                            ? t("Updating...")
                                            : locale === "hi"
                                              ? `${translateStatus(locale, getNextStatus(selectedIssue))} के रूप में चिह्नित करें`
                                              : `Mark as ${translateStatus(locale, getNextStatus(selectedIssue))}`}
                                    </button>

                                </div>
                            )}

                            {/* =================================================
                                DESCRIPTION
                            ================================================== */}

                            <div className="issue-detail-section">

                                <h3>
                                    {t("Description")}
                                </h3>

                                <p className="issue-description">
                                    {selectedIssue.description ||
                                        t("No description provided.")}
                                </p>

                            </div>

                            {/* =================================================
                                LOCATION
                            ================================================== */}

                            <div className="issue-detail-section">

                                <h3>
                                    {t("Location")}
                                </h3>

                                <div className="issue-location">

                                    <div>
                                        <span>
                                            {t("Latitude")}
                                        </span>

                                        <strong>
                                            {selectedIssue.latitude ??
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            {t("Longitude")}
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
                                {t("Close")}
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
                        onKeyDown={(event) =>
                            handleDialogKeyDown(
                                event,
                                closeAssignModal,
                                assigning
                            )
                        }
                    >

                        <div
                            className="issue-modal assign-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="issue-assignment-dialog-title"
                            tabIndex="-1"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="issue-modal-header">

                                <div>
                                    <h2 id="issue-assignment-dialog-title">
                                        {t("Assign Issue")} #
                                        {
                                            assigningIssue.id
                                        }
                                    </h2>

                                    <p>
                                        {t("Assign this verified issue to a department officer.")}
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
                                    aria-label={t("Close assignment dialog")}
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
                                            {t("Current status")}
                                        </span>

                                        <strong>
                                            {translateStatus(
                                                locale,
                                                assigningIssue.status
                                            )}
                                        </strong>

                                    </div>

                                    <div className="filter-field assignment-field">

                                        <label htmlFor="assigned-officer">
                                            {t("Select Department Officer")}
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
                                                    ? t("Loading officers...")
                                                    : officers.length === 0
                                                      ? t("No department officers available")
                                                      : t("Choose an officer")}
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
                                        {t("Cancel")}
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
                                            ? t("Assigning...")
                                            : t("Assign Issue")}
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