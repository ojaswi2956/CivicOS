
import { useState } from "react";
import { translateStatus, useLocale } from "./i18n/LocaleContext";

function NavIcon({ name, size = 19 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const icons = {
        overview: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </>
        ),
        issues: (
            <>
                <rect x="5" y="4" width="14" height="17" rx="2" />
                <path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" />
            </>
        ),
        risk: (
            <>
                <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" />
                <path d="M12 8v5M12 16h.01" />
            </>
        ),
        trust: (
            <>
                <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                <rect x="2.5" y="10" width="3" height="10" rx="1" />
                <rect x="8.5" y="4" width="3" height="16" rx="1" />
                <rect x="14.5" y="13" width="3" height="7" rx="1" />
            </>
        ),
        hotspots: (
            <>
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
            </>
        ),
        departments: (
            <>
                <path d="M3 21h18M5 21V5l7-3v19M19 21V9l-7-4" />
                <path d="M8 8v.01M8 12v.01M8 16v.01M15 12v.01M15 16v.01" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </>
        ),
        menu: <path d="M4 6h16M4 12h16M4 18h16" />,
        close: <path d="M18 6 6 18M6 6l12 12" />,
        moon: (
            <path d="M20.8 13.2A8.5 8.5 0 0 1 10.8 3.2 8.5 8.5 0 1 0 20.8 13.2Z" />
        ),
        sun: (
            <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </>
        ),
    };

    return <svg {...common}>{icons[name] || null}</svg>;
}

function Navbar({ role, currentPath, onNavigate, onLogout, theme, onToggleTheme }) {
    const { locale, t, toggleLocale } = useLocale();
    const [menuOpen, setMenuOpen] = useState(false);

    const navItems = [
        { label: t("Overview"), path: "/", icon: "overview" },
        { label: t("Manage Issues"), path: "/issues", icon: "issues" },
        { label: t("Risk Radar"), path: "/#risk", icon: "risk" },
        { label: t("Trust Score"), path: "/#trust", icon: "trust" },
        { label: t("Hotspots"), path: "/#hotspots", icon: "hotspots" },
        { label: t("Departments"), path: "/#departments", icon: "departments" },
    ];

    const navigateTo = (path) => {
        setMenuOpen(false);

        if (path === "/#risk" || path === "/#trust" ||
            path === "/#hotspots" || path === "/#departments") {
            onNavigate("/");
            const section = path.split("#")[1];

            window.setTimeout(() => {
                document.getElementById(section)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 100);

            return;
        }

        onNavigate(path);
    };

    return (
        <>
            <header className="civicos-navbar">
                <button
                    type="button"
                    className="navbar-brand"
                    onClick={() => navigateTo("/")}
                    aria-label={t("Go to CivicOS overview")}
                >
                    <span className="navbar-logo">C</span>
                    <span className="navbar-brand-text">
                        <span className="navbar-brand-name">CivicOS</span>
                        <span className="navbar-brand-caption">
                            {t("Public Infrastructure Management")}
                        </span>
                    </span>
                </button>

                <button
                    type="button"
                    className="navbar-menu-toggle"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label={menuOpen ? t("Close menu") : t("Open menu")}
                    aria-expanded={menuOpen}
                >
                    <NavIcon name={menuOpen ? "close" : "menu"} size={22} />
                </button>

                <div className="navbar-top-actions">
                    <span className="navbar-role">
                        {translateStatus(locale, role || "CITIZEN")}
                    </span>
                    <button
                        type="button"
                        className="navbar-language-toggle"
                        onClick={toggleLocale}
                        aria-label={t("Switch language")}
                        title={t("Switch language")}
                    >
                        {locale === "hi" ? "English" : "हिन्दी"}
                    </button>
                    <button
                        type="button"
                        className="navbar-theme-toggle"
                        onClick={onToggleTheme}
                        aria-label={t(`Switch to ${theme === "dark" ? "light" : "dark"} mode`)}
                        aria-pressed={theme === "dark"}
                        title={t(`Switch to ${theme === "dark" ? "light" : "dark"} mode`)}
                    >
                        <NavIcon name={theme === "dark" ? "sun" : "moon"} size={18} />
                    </button>
                    <button
                        type="button"
                        className="navbar-logout"
                        onClick={onLogout}
                    >
                        <NavIcon name="logout" size={17} />
                        <span>{t("Logout")}</span>
                    </button>
                </div>
            </header>

            <div className="civicos-app-layout">
                <aside
                    className={`civicos-sidebar ${menuOpen ? "sidebar-open" : ""}`}
                >
                    <div className="sidebar-section-label">
                        {role === "ADMIN"
                            ? t("ADMIN MENU")
                            : role === "DEPARTMENT"
                              ? t("DEPARTMENT MENU")
                              : t("CITIZEN MENU")}
                    </div>

                    <nav className="sidebar-navigation" aria-label={t("Main navigation")}>
                        {navItems.map((item) => {
                            const active =
                                item.path === "/"
                                    ? currentPath === "/"
                                    : item.path === "/issues"
                                      ? currentPath === "/issues"
                                      : false;

                            return (
                                <button
                                    key={item.path}
                                    type="button"
                                    className={`sidebar-link ${active ? "active" : ""}`}
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => navigateTo(item.path)}
                                >
                                    <NavIcon name={item.icon} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="sidebar-account">
                        <span className="navbar-role">
                            {translateStatus(locale, role || "CITIZEN")}
                        </span>
                        <button
                            type="button"
                            className="navbar-logout sidebar-logout"
                            onClick={onLogout}
                        >
                            <NavIcon name="logout" size={17} />
                            <span>{t("Logout")}</span>
                        </button>
                    </div>
                </aside>

                {menuOpen && (
                    <button
                        type="button"
                        className="sidebar-backdrop"
                        aria-label={t("Close menu")}
                        onClick={() => setMenuOpen(false)}
                    />
                )}
            </div>
        </>
    );
}

export default Navbar;
