import axios from "axios";

const API_URL = "http://localhost:5000/api/bookings";
const COURT_API_URL = "http://localhost:5000/api/courts";

export const fetchBookingsForDate = async (date) => {
  const response = await axios.get(`${API_URL}?date=${date}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};

export const fetchCourts = async () => {
  const response = await axios.get(COURT_API_URL);
  return response.data;
};

export const bookCourt = async (data) => {
  const response = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};

export const bookRecurringCourt = async (data) => {
  const response = await axios.post(`${API_URL}/recurring`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};
