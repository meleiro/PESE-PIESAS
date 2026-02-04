const mode = ( process.env.DATA_ACCESS || "pg" ).toLowerCase();

console.log("Repo mode:", process.env.DATA_ACCESS);

if (mode === "prisma"){
    module.exports = require("./componentes.prisma.repo");
} else {
     module.exports = require("./componentes.pg.repo");
     console.log("Cargando repo PG");
}