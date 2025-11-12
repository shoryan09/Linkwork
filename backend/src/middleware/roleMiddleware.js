const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasRole =
      allowedRoles.includes(req.user.role) || req.user.role === "both";

    if (!hasRole) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = checkRole;
