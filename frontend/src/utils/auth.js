// src/utils/auth.js
export const getToken = () => localStorage.getItem("token");

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => {
  const user = getCurrentUser();
  const token = getToken();
  if (!user || !token) return false;

  const currentTime = Date.now() / 1000;
  return user.exp && user.exp > currentTime;
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === "admin" && isLoggedIn();
};
