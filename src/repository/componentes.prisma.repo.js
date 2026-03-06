// src/repository/componentes.prisma.repo.js
const prisma = require("../prismaClient");

/**
 * OJO: aquí el nombre del modelo depende de tu schema.prisma.
 * Tras "prisma db pull", suele ser algo como:
 * model componentes { ... }  o  model Componentes { ... }
 *
 * Ajusta "prisma.componentes" por el nombre real.
 */
const model = prisma.componentes; // <-- CAMBIAR si tu modelo se llama distinto

module.exports = {
  async getAll() {
    return model.findMany({ orderBy: { id: "asc" } });
  },

  async getById(id) {
    return model.findUnique({ where: { id } });
  },

  async create(data) {
    const { nombre, tipo, precio = 0, stock = 0 } = data;
    return model.create({
      data: { nombre, tipo, precio, stock },
    });
  },

  async update(id, data) {
    // Prisma no usa COALESCE: simplemente NO incluyas campos undefined.
    // Así haces “update parcial”.
    const payload = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.tipo !== undefined) payload.tipo = data.tipo;
    if (data.precio !== undefined) payload.precio = data.precio;
    if (data.stock !== undefined) payload.stock = data.stock;

    return model.update({
      where: { id },
      data: payload,
    });
  },

  async remove(id) {
    await model.delete({ where: { id } });
    return true;
  },
};
