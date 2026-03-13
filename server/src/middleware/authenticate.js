import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Access token missing or malformed",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decoded.userId; // attach userId to every protected request
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Access token expired or invalid",
    });
  }
};