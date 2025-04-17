import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // Use the environment variable
  withCredentials: true,
});
