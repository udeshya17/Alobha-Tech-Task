export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req?.auth?.role;
    if (!role) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(role)) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}


