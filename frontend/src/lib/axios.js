import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
});
