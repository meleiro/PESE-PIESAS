// src/app.js
// =====================================================
// ARCHIVO PRINCIPAL DE LA API REST
// Node.js + Express + PostgreSQL
// =====================================================


// -----------------------------------------------------
// 1. CARGA DE VARIABLES DE ENTORNO
// -----------------------------------------------------
// Carga las variables definidas en el archivo .env
// Ejemplos habituales:
// - PORT (puerto del servidor)
// - Credenciales de la base de datos
// - URLs, claves, etc.
require("dotenv").config();


// -----------------------------------------------------
// 2. IMPORTACIONES PRINCIPALES
// -----------------------------------------------------

// Importamos Express, el framework web para Node.js
// Nos permite crear rutas, middlewares y servidores HTTP
const express = require("express");

// Importamos el pool de conexión a PostgreSQL
// Normalmente creado con la librería 'pg'
// Este pool gestiona las conexiones a la base de datos
const repo = require("./repository");

// Importamos el módulo 'path' de Node
// Sirve para construir rutas del sistema de forma segura
const path = require("path");


// -----------------------------------------------------
// 3. CREACIÓN DE LA APLICACIÓN EXPRESS
// -----------------------------------------------------

// Creamos la aplicación Express
const app = express();


// -----------------------------------------------------
// 4. MIDDLEWARES
// -----------------------------------------------------

// Middleware para que Express pueda interpretar JSON
// en el cuerpo (body) de las peticiones HTTP.
//
// SIN este middleware:
// - req.body === undefined
//
// CON este middleware:
// - req.body contiene el objeto enviado en JSON
app.use(express.json());


// Middleware para servir archivos estáticos
// Permite acceder a HTML, CSS y JS desde la carpeta /public
//
// Ejemplo:
// http://localhost:3000/index.html
//
// __dirname  -> carpeta actual (src)
// ".."       -> subimos un nivel
// "public"   -> carpeta pública
app.use(express.static(path.join(__dirname, "..", "public")));


// =====================================================
// 5. RUTAS DE LA API REST
// =====================================================


// -----------------------------------------------------
// GET /componentes
// -----------------------------------------------------
// Devuelve el listado completo de componentes
// -----------------------------------------------------
app.get("/componentes", async (req, res) => {
  try {
    
    const result = await repo.getAll();
    // result.rows contiene el array de filas
    res.json(result.rows);

  } catch (err) {
    // Error interno del servidor
    res.status(500).json({
      error: "Error al listar componentes",
      detalle: err.message
    });
  }
});


// -----------------------------------------------------
// GET /componentes/:id
// -----------------------------------------------------
// Devuelve un componente concreto por su id
// -----------------------------------------------------
app.get("/componentes/:id", async (req, res) => {

  // Extraemos el id de la URL
  // Ej: /componentes/5  -> id = 5
  const { id } = req.params;

  try {
    // Consulta con parámetro ($1) para evitar SQL Injection
    const result = await pool.query(
      "SELECT * FROM componentes WHERE id = $1",
      [id]
    );

    // Si no existe ningún registro, devolvemos 404
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    // Devolvemos el primer (y único) registro
    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Error al obtener componentes",
      detalle: err.message
    });
  }
});


// -----------------------------------------------------
// POST /componentes
// -----------------------------------------------------
// Crea un nuevo componente
// -----------------------------------------------------
app.post("/componentes", async (req, res) => {

  // Desestructuración del body
  // - nombre y tipo son obligatorios
  // - marca por defecto null
  // - precio y stock por defecto 0
  const {
    nombre,
    tipo,
    marca = null,
    precio = 0,
    stock = 0
  } = req.body;

  // Validación básica
  if (!nombre || !tipo) {
    return res.status(400).json({
      error: "Campos obligatorios: nombre y tipo"
    });
  }

  try {
    // Inserción en la base de datos
    const result = await pool.query(
      `INSERT INTO componentes (nombre, tipo, marca, precio, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, tipo, marca, precio, stock]
    );

    // 201 Created + el recurso creado
    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Error al crear componentes",
      detalle: err.message
    });
  }
});


// -----------------------------------------------------
// PUT /componentes/:id
// -----------------------------------------------------
// Modifica un componente existente
// -----------------------------------------------------
app.put("/componentes/:id", async (req, res) => {

  // id del componente a modificar
  const { id } = req.params;

  // Datos recibidos en el body
  const { nombre, tipo, marca, precio, stock } = req.body;

  try {
    // Validación de campos obligatorios
    if (!nombre || !tipo) {
      return res.status(400).json({
        error: "Campos obligatorios: nombre y tipo"
      });
    }

    // Comprobamos si el componente existe
    const exists = await pool.query(
      "SELECT * FROM componentes WHERE id = $1",
      [id]
    );

    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    // Actualización usando COALESCE
    // - Si el valor recibido es null, se mantiene el valor actual
    // - Permite actualizaciones parciales
    const result = await pool.query(
      `UPDATE componentes
       SET
         nombre = COALESCE($1, nombre),
         tipo   = COALESCE($2, tipo),
         marca  = COALESCE($3, marca),
         precio = COALESCE($4, precio),
         stock  = COALESCE($5, stock)
       WHERE id = $6
       RETURNING *`,
      [
        nombre ?? null,
        tipo ?? null,
        marca ?? null,
        precio ?? null,
        stock ?? null,
        id
      ]
    );

    // Devolvemos el componente actualizado
    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Error al actualizar componente",
      detalle: err.message
    });
  }
});


// -----------------------------------------------------
// DELETE /componentes/:id
// -----------------------------------------------------
// Elimina un componente por id
// -----------------------------------------------------
app.delete("/componentes/:id", async (req, res) => {

  const { id } = req.params;

  try {
    // Eliminamos y devolvemos el registro eliminado
    const result = await pool.query(
      "DELETE FROM componentes WHERE id = $1 RETURNING *",
      [id]
    );

    // Si no se ha eliminado nada, no existía
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    // 204 No Content: operación correcta sin contenido
    res.status(204).send();

  } catch (err) {
    res.status(500).json({
      error: "Error al eliminar componente",
      detalle: err.message
    });
  }
});


// =====================================================
// 6. ARRANQUE DEL SERVIDOR
// =====================================================

// Puerto definido en .env o 3000 por defecto
const PORT = process.env.PORT || 3000;

// Iniciamos el servidor HTTP
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
