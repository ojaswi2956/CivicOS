import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api"
});

// Automatically attach the saved JWT to every API request.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("civicos_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Let Axios/browser automatically set the correct
        // Content-Type when sending FormData.
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        } else {
            config.headers["Content-Type"] = "application/json";
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;