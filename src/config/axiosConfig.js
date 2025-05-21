import axios from 'axios';

// Create an Axios instance
export default axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

