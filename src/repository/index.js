const mode = ( process.env.DATA_ACCESS || "pg" ).toLowerCase();

if (mode === "prisma"){
    module.exports = require("./componentes.prisma.repo");
} else {
     module.exports = require("./componentes.pg.repo");
}