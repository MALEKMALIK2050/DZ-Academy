const bcrypt = require("bcryptjs");

const result = bcrypt.compareSync(
  "lmk-teb",
  "$2b$10$OYtt6LiLh3qT.vHyLigRO.5dLE8FnM0G2HXa.yHEOlZWt9uDJqmGi"
);

console.log(result);