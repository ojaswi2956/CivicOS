
import { useState } from "react";
import api from "../api/axios";
import { useLocale } from "../i18n/LocaleContext";

function Login({ onLoginSuccess, theme, onToggleTheme }) {
    const { locale, t, toggleLocale } = useLocale();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
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
            const name = response.data.name;

            localStorage.setItem("civicos_token", token);
            localStorage.setItem("civicos_role", role);
            if (name) {
                localStorage.setItem("civicos_name", name);
            }

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

    const handleRegister = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError(t("Passwords do not match."));
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/register", {
                name,
                email,
                password,
            });
            setIsRegistering(false);
            setPassword("");
            setConfirmPassword("");
            setSuccess(t("Account created. Sign in with your email and password."));
        } catch (registrationError) {
            const responseData = registrationError.response?.data;
            const validationErrors = Object.values(responseData?.details || {});
            setError(
                responseData?.message ||
                    validationErrors.join(" ") ||
                    t("Unable to create your account. Please try again.")
            );
        } finally {
            setLoading(false);
        }
    };

    const switchFormMode = () => {
        setIsRegistering((registering) => !registering);
        setError("");
        setSuccess("");
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
                        <h2 id="login-title">
                            {isRegistering ? t("Create your account") : t("Welcome back")}
                        </h2>
                        <p>
                            {isRegistering
                                ? t("Register as a citizen to report issues and track their progress.")
                                : t("Sign in to continue to your workspace.")}
                        </p>
                    </div>

                    <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                        {isRegistering && (
                            <>
                                <label htmlFor="register-name">{t("Full name")}</label>
                                <input
                                    id="register-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    autoComplete="name"
                                    maxLength={120}
                                    required
                                />
                            </>
                        )}

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
                            placeholder={
                                isRegistering
                                    ? t("Create a password (at least 8 characters)")
                                    : t("Enter your password")
                            }
                            autoComplete={isRegistering ? "new-password" : "current-password"}
                            minLength={isRegistering ? 8 : undefined}
                            required
                        />

                        {isRegistering && (
                            <>
                                <label htmlFor="register-confirm-password">
                                    {t("Confirm password")}
                                </label>
                                <input
                                    id="register-confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </>
                        )}

                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="login-success" role="status">
                                {success}
                            </p>
                        )}

                        <button type="submit" disabled={loading}>
                            {loading
                                ? isRegistering
                                    ? t("Creating account...")
                                    : t("Signing in...")
                                : isRegistering
                                  ? t("Create account")
                                  : t("Sign in")}
                            {!loading && <span aria-hidden="true">→</span>}
                        </button>
                    </form>

                    <p className="login-mode-switch">
                        {isRegistering
                            ? t("Already have an account?")
                            : t("New to CivicOS?")}
                        <button
                            type="button"
                            className="login-mode-toggle"
                            onClick={switchFormMode}
                            disabled={loading}
                        >
                            {isRegistering ? t("Sign in") : t("Create account")}
                        </button>
                    </p>

                    <p className="login-support">
                        {t("Secure access for CivicOS users")}
                    </p>
                </section>
            </div>
        </div>
    );
}

export default Login;