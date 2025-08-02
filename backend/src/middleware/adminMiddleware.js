// Admin middleware to ensure the user is an admin
export const protectAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access forbidden: Admins only" });
  }
  next();
};
