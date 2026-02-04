const pool = require("../db");

const TABLE = "componentes";

module.exports = {

    async getAll() {
        const result = await pool.query(
            `SELECT * FROM ${TABLE} ORDER BY id ASC`
        );
        return result;
    },

    async getById(id) {
        return model.findUnique({ where: { id } });
    },

    async create(datos) {
        const {
            nombre,
            tipo,
            marca = null,
            precio = 0,
            stock = 0
        } = datos;

        return model.create({ data: { nombre, tipo, marca, precio, stock }, });

    },

    async update(id, datos) {

        const payload = {};

        if (datos.nombre !== undefined) payload.nombre = datos.nombre;
        if (datos.tipo !== undefined) payload.tipo = datos.tipo;
        if (datos.precio !== undefined) payload.precio = datos.precio;
        if (datos.stock !== undefined) payload.stock = datos.stock;
        if (datos.marca !== undefined) payload.marca = datos.marca;

        return model.update({
            where: { id },
            data: payload,

        });

    },

    async remove(id) {
        await model.delete({ where: { id } });
        return true;

    },


}

