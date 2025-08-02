import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const protect = (req, res, next) => {
  // console.info("protected route hit")
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, '954367d42d3dac71d30442cc02180e2dbccb484de288b9283494e32ba7d26c250668e1e036907e7407e64bddb5b4c59bddcdb3c66c778ec66d0c192afdcf0323');
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error at authMiddleware : ", error)
    res.status(401).json({ message: "Invalid token" });
  }
};

export const admin = (req, res, next) => {
  // console.log("Admin check hit")
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};
