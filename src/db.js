// Importamos la clase Pool del módulo 'pg' (node-postgres)
// Pool permite gestionar un conjunto de conexiones reutilizables
// a la base de datos (mejor rendimiento que abrir/cerrar conexiones)
require("dotenv").config();  
const { Pool } = require("pg");

const password = String(process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? "");

console.log("db.js cargado desde:", __filename);
console.log("DB_USER:", process.env.DB_USER);
console.log("password typeof:", typeof password, "| len:", password.length);

// Creamos una instancia de Pool con la configuración de conexión
const pool = new Pool({

    // Dirección del servidor de base de datos
    // Ejemplo: "localhost" o una IP
    host: process.env.DB_HOST,

    // Puerto en el que escucha PostgreSQL
    // Normalmente 5432
    // Se convierte a Number porque las variables de entorno son strings
    port: Number(process.env.DB_PORT),

    // Usuario de la base de datos
    user: process.env.DB_USER,

    // Contraseña del usuario
    password: process.env.DB_PASSWORD,

    // Nombre de la base de datos a la que nos conectamos
    database: process.env.DB_DATABASE,

});

// Exportamos el pool para poder usarlo en otros archivos
// Por ejemplo, en app.js:
// const pool = require("./db");
module.exports = pool;
