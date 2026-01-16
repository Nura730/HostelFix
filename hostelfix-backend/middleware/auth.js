const jwt = require("jsonwebtoken");

module.exports = (roles = []) => {

 return (req, res, next) => {

  const token = req.headers.authorization;

  if (!token)
   return res.status(401).json("No token");

  try {

   const decoded = jwt.verify(
     token,
     process.env.JWT_SECRET
   );

   if (roles.length && !roles.includes(decoded.role))
     return res.status(403).json("Forbidden");

   req.user = decoded;
   next();

  } catch {
   res.status(401).json("Invalid token");
  }

 };
};
