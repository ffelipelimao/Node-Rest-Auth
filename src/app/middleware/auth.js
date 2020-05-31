const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(403).send({ message: "Forbiden" });
  }
  //Bearer asasdksndosjnaodnsi

  const parts = authHeader.split(" ");

  if (!parts.lenght === 2) {
    res.status(401).send({ message: "Token error" });
  }
  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).send({ message: "Token malformated" });
  }

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Token invalid" });

    req.userId = decoded.params.id;
    return next();
  });
};
