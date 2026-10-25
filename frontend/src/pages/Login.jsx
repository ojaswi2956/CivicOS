
import { useState } from "react";
import api from "../api/axios";
import { useLocale } from "../i18n/LocaleContext";

function Login({ onLoginSuccess, theme, onToggleTheme }) {
    const { locale, t, toggleLocale } = useLocale();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post(
                "/auth/login",
                {
                    email,
                    password
                }
            );

            const token = response.data.token;
            const role = response.data.role;

            localStorage.setItem("civicos_token", token);
            localStorage.setItem("civicos_role", role);

            onLoginSuccess(token);

        } catch (error) {
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError(t("Login failed. Please try again."));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <button
                type="button"
                className="login-language-toggle"
                onClick={toggleLocale}
                aria-label={t("Switch language")}
                title={t("Switch language")}
            >
                {locale === "hi" ? "English" : "हिन्दी"}
            </button>
            <button
                type="button"
                className="login-theme-toggle"
                onClick={onToggleTheme}
                aria-label={t(`Switch to ${theme === "dark" ? "light" : "dark"} mode`)}
                aria-pressed={theme === "dark"}
                title={t(`Switch to ${theme === "dark" ? "light" : "dark"} mode`)}
            >
                <svg
                    viewBox="0 0 24 24"
                    width="19"
                    height="19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    {theme === "dark" ? (
                        <>
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                        </>
                    ) : (
                        <path d="M20.8 13.2A8.5 8.5 0 0 1 10.8 3.2 8.5 8.5 0 1 0 20.8 13.2Z" />
                    )}
                </svg>
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            <div className="login-card">
                <section className="login-brand-panel" aria-label={t("About CivicOS")}>
                    <div className="login-brand">
                        <span className="login-brand-mark" aria-hidden="true">
                            C
                        </span>
                        <span>CivicOS</span>
                    </div>

                    <div className="login-brand-copy">
                        <span className="login-eyebrow">
                            {t("PUBLIC INFRASTRUCTURE, CONNECTED")}
                        </span>
                        <h1>{t("Better cities start with being heard.")}</h1>
                        <p>
                            {t("A shared space for communities and public teams to report issues, track progress, and improve the places we live.")}
                        </p>
                    </div>

                    <div className="login-brand-footer">
                        <span className="login-status-dot" aria-hidden="true" />
                        <span>{t("One platform. Stronger communities.")}</span>
                    </div>
                    <span className="login-decoration" aria-hidden="true" />
                </section>

                <section className="login-form-panel" aria-labelledby="login-title">
                    <div className="login-form-heading">
                        <span className="login-eyebrow">
                            {t("YOUR CIVICOS ACCOUNT")}
                        </span>
                        <h2 id="login-title">{t("Welcome back")}</h2>
                        <p>{t("Sign in to continue to your workspace.")}</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <label htmlFor="login-email">{t("Email address")}</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            autoComplete="username"
                            required
                        />

                        <label htmlFor="login-password">{t("Password")}</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder={t("Enter your password")}
                            autoComplete="current-password"
                            required
                        />

                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button type="submit" disabled={loading}>
                            {loading ? t("Signing in...") : t("Sign in")}
                            {!loading && <span aria-hidden="true">→</span>}
                        </button>
                    </form>

                    <p className="login-support">
                        {t("Secure access for CivicOS users")}
                    </p>
                </section>
            </div>
        </div>
    );
}

export default Login;