// src/repository/index.js
const mode = (process.env.DATA_ACCESS || "pg").toLowerCase();

if (mode === "prisma") {
  module.exports = require("./componentes.prisma.repo");
  console.log("Usando Prisma");
} else {
  module.exports = require("./componentes.pg.repo");
  console.log("Usando DAO");
}
