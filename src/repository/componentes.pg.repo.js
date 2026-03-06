// src/repository/componentes.pg.repo.js
const pool = require("../db");
const TABLE = "componentes";

module.exports = {
  async getAll() {
    const result = await pool.query(`SELECT * FROM ${TABLE} ORDER BY id ASC`);
    return result.rows; // ✅ devolvemos directamente el array
  },

  async getById(id) {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async create(datos) {
    const {
      nombre,
      tipo,
      marca = null,
      precio = 0,
      stock = 0
    } = datos;

    const result = await pool.query(
      `INSERT INTO ${TABLE} (nombre, tipo, marca, precio, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, tipo, marca, precio, stock]
    );

    return result.rows[0];
  },

  async update(id, datos) {
    // update parcial
    const fields = [];
    const values = [];
    let i = 1;

    for (const [k, v] of Object.entries(datos)) {
      fields.push(`${k} = $${i++}`);
      values.push(v);
    }

    if (fields.length === 0) return await this.getById(id);

    values.push(id);

    const result = await pool.query(
      `UPDATE ${TABLE}
       SET ${fields.join(", ")}
       WHERE id = $${i}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await pool.query(
      `DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }
};
