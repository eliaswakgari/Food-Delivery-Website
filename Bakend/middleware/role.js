const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.userRole || req.userRole !== role) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};

module.exports = requireRole;
