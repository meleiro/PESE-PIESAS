// src/app.js
// -----------------------------
// ARCHIVO PRINCIPAL DE LA API
// -----------------------------

// Carga las variables de entorno desde un archivo .env
// Ejemplo: PORT, credenciales de la base de datos, etc.
require("dotenv").config();

// Importamos Express, el framework web para Node.js
const express = require("express");

// Importamos el pool de conexión a la base de datos
// Normalmente creado con 'pg' (PostgreSQL)
const pool = require("./db");

// Creamos la aplicación Express
const app = express();

// Middleware para que Express pueda entender JSON en el body
// Sin esto, req.body sería undefined
app.use(express.json());

// Módulo nativo de Node para trabajar con rutas del sistema
const path = require("path");

// Middleware para servir archivos estáticos
// Esto permite acceder a HTML, CSS, JS desde /public
// Ej: http://localhost:3000/index.html
app.use(express.static(path.join(__dirname, "..", "public")));



/* ======================================================
   ARRANQUE DEL SERVIDOR
   ====================================================== */

// Puerto desde .env o 3000 por defecto
const PORT = process.env.PORT || 3000;

// Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});