// import { useState } from 'react'
// import heroImg from './assets/hero.png'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <section id="center">
//         <div className="hero">
//           <img src={heroImg} className="base" width="170" height="179" alt="" />
//           <img src={reactLogo} className="framework" alt="React logo" />
//           <img src={viteLogo} className="vite" alt="Vite logo" />
//         </div>
//         <div>
//           <h1>Get started</h1>
//           <p>
//             Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
//           </p>
//         </div>
//         <button
//           type="button"
//           className="counter"
//           onClick={() => setCount((count) => count + 1)}
//         >
//           Count is {count}
//         </button>
//       </section>

//       <div className="ticks"></div>

//       <section id="next-steps">
//         <div id="docs">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#documentation-icon"></use>
//           </svg>
//           <h2>Documentation</h2>
//           <p>Your questions, answered</p>
//           <ul>
//             <li>
//               <a href="https://vite.dev/" target="_blank">
//                 <img className="logo" src={viteLogo} alt="" />
//                 Explore Vite
//               </a>
//             </li>
//             <li>
//               <a href="https://react.dev/" target="_blank">
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App





import { useEffect, useState } from "react";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Issues from "./pages/Issues";
import Navbar from "./Navbar";
import { LocaleProvider } from "./i18n/LocaleContext";

function AppContent() {
    const [token, setToken] = useState(
        localStorage.getItem("civicos_token")
    );

    const [role, setRole] = useState(
        localStorage.getItem("civicos_role")
    );

    const [path, setPath] = useState(window.location.pathname);
    const [theme, setTheme] = useState(
        localStorage.getItem("civicos_theme") === "dark" ? "dark" : "light"
    );

    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        const handleStorageChange = () => {
            setToken(localStorage.getItem("civicos_token"));
            setRole(localStorage.getItem("civicos_role"));
        };

        window.addEventListener("popstate", handlePopState);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const navigate = (nextPath) => {
        if (window.location.pathname !== nextPath) {
            window.history.pushState({}, "", nextPath);
        }

        setPath(nextPath);
    };

    const handleLoginSuccess = (newToken) => {
        setToken(newToken || localStorage.getItem("civicos_token"));
        setRole(localStorage.getItem("civicos_role"));
        navigate("/");
    };

    const handleLogout = () => {
        localStorage.removeItem("civicos_token");
        localStorage.removeItem("civicos_role");

        setToken(null);
        setRole(null);

        navigate("/");
    };

    const toggleTheme = () => {
        setTheme((currentTheme) => {
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            localStorage.setItem("civicos_theme", nextTheme);
            return nextTheme;
        });
    };

    return (
        <div className="civicos-shell" data-theme={theme}>
            {!token ? (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            ) : (
                <>
                    <Navbar
                        role={role}
                        currentPath={path}
                        onNavigate={navigate}
                        onLogout={handleLogout}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                    />

                    {path === "/issues" ? (
                        <Issues
                            onNavigate={navigate}
                            onLogout={handleLogout}
                        />
                    ) : (
                        <Dashboard
                            onNavigate={navigate}
                            onLogout={handleLogout}
                        />
                    )}
                </>
            )}
        </div>
    );
}

function App() {
    return (
        <LocaleProvider>
            <AppContent />
        </LocaleProvider>
    );
}

export default App;
