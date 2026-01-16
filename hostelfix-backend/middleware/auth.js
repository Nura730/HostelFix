const jwt = require("jsonwebtoken");

module.exports = (roles = []) => {

 return (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader)
   return res.status(401).json("No token");

  // Remove "Bearer "
  const token = authHeader.split(" ")[1];

  if(!token)
   return res.status(401).json("Invalid token format");

  try {

   const decoded = jwt.verify(
     token,
     process.env.JWT_SECRET
   );

   if (roles.length && !roles.includes(decoded.role))
     return res.status(403).json("Forbidden");

   req.user = decoded;
   next();

  } catch (err) {
   res.status(401).json("Invalid token");
  }

 };
};
