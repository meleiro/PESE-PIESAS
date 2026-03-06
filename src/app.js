// src/app.js
require("dotenv").config();
const express = require("express");
const path = require("path");

// Importa el repositorio "abstracto" (elige pg o prisma según env)
const repo = require("./repository");

const app = express();
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, "..", "public")));

/**
 * GET /componentes -> listar
 */
app.get("/componentes", async (req, res) => {
  try {
    // ✅ repo.getAll debe devolver directamente un array (PG: rows, Prisma: array)
    const rows = await repo.getAll();
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al listar componentes", detalle: err.message });
  }
});

/**
 * GET /componentes/:id -> obtener uno
 */
app.get("/componentes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido (debe ser numérico)" });
  }

  try {
    const item = await repo.getById(id);
    if (!item) return res.status(404).json({ error: "No encontrado" });
    res.json(item);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener componente", detalle: err.message });
  }
});

/**
 * POST /componentes -> crear
 * Body JSON: { nombre, tipo, marca?, precio?, stock? }
 */
app.post("/componentes", async (req, res) => {
  const { nombre, tipo, marca = null, precio = 0, stock = 0 } = req.body;

  if (!nombre || !String(nombre).trim() || !tipo || !String(tipo).trim()) {
    return res
      .status(400)
      .json({ error: "Campos obligatorios: nombre, tipo" });
  }

  try {
    const created = await repo.create({
      nombre: String(nombre).trim(),
      tipo: String(tipo).trim(),
      marca: marca === null ? null : String(marca).trim(),
      precio: Number(precio) || 0,
      stock: Number(stock) || 0,
    });

    res.status(201).json(created);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al crear componente", detalle: err.message });
  }
});

/**
 * PUT /componentes/:id -> actualizar (parcial permitido)
 * Body JSON: { nombre?, tipo?, marca?, precio?, stock? }
 */
app.put("/componentes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido (debe ser numérico)" });
  }

  // Construimos un objeto "parcial" con solo lo que venga definido
  const datos = {};
  if (req.body.nombre !== undefined) datos.nombre = String(req.body.nombre).trim();
  if (req.body.tipo !== undefined) datos.tipo = String(req.body.tipo).trim();
  if (req.body.marca !== undefined)
    datos.marca = req.body.marca === null ? null : String(req.body.marca).trim();
  if (req.body.precio !== undefined) datos.precio = Number(req.body.precio) || 0;
  if (req.body.stock !== undefined) datos.stock = Number(req.body.stock) || 0;

  try {
    // Comprobamos si existe (agnóstico a pg/prisma)
    const exists = await repo.getById(id);
    if (!exists) return res.status(404).json({ error: "No encontrado" });

    const updated = await repo.update(id, datos);
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al actualizar componente", detalle: err.message });
  }
});

/**
 * DELETE /componentes/:id -> eliminar
 */
app.delete("/componentes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido (debe ser numérico)" });
  }

  try {
    const deleted = await repo.remove(id);
    if (!deleted) return res.status(404).json({ error: "No encontrado" });

    // 204: borrado OK, sin body
    res.status(204).send();
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al eliminar componente", detalle: err.message });
  }
});

// Arranque
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`API escuchando en http://localhost:${PORT}`)
);
