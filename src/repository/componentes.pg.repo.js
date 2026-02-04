/**
 * ============================================================
 * REPOSITORIO DAO (PostgreSQL con node-postgres "pg")
 * ============================================================
 * Este archivo implementa las operaciones CRUD sobre la tabla
 * "componentes" usando SQL directo.
 *
 * Importante en tu arquitectura:
 * - Este repo debe devolver los mismos tipos que el repo Prisma:
 *   getAll()   -> Array
 *   getById()  -> Objeto | null
 *   create()   -> Objeto creado
 *   update()   -> Objeto actualizado | null
 *   remove()   -> boolean
 *
 * Así el controlador (app.js) puede alternar entre PG/Prisma
 * sin cambiar ni una línea.
 */

/**
 * Importamos el "pool" de conexiones.
 * - pool es un conjunto de conexiones reutilizables hacia PostgreSQL.
 * - Evita abrir/cerrar conexiones cada vez (mejor rendimiento).
 * - pool.query(sql, params) ejecuta SQL con parámetros seguros.
 */
const pool = require("../db");

/**
 * Nombre de la tabla.
 * Tenerlo en constante facilita:
 * - cambiar el nombre si la tabla cambia
 * - reutilizarlo en todas las queries
 *
 * OJO: al interpolar TABLE en un template string, asumes que es
 * un valor controlado por ti (no viene de usuario), así que es seguro.
 * Los valores de usuario SIEMPRE deben ir como parámetros ($1, $2...).
 */
const TABLE = "componentes";

module.exports = {
  /**
   * ------------------------------------------------------------
   * GET ALL
   * ------------------------------------------------------------
   * Devuelve todos los registros ordenados por id ASC.
   *
   * SQL equivalente:
   *   SELECT * FROM componentes ORDER BY id ASC;
   *
   * node-postgres (pg) devuelve un objeto "result" con:
   * - result.rows      -> array de filas (lo que queremos)
   * - result.rowCount  -> nº de filas afectadas
   * - etc.
   *
   * Para alinear con Prisma:
   * - devolvemos SIEMPRE un array (rows).
   */
  async getAll() {
    // Ejecutamos la consulta SQL. No hay parámetros porque no hay filtros.
    const result = await pool.query(`SELECT * FROM ${TABLE} ORDER BY id ASC`);

    // rows es un array de objetos: [{id, nombre, ...}, {...}]
    return result.rows;
  },

  /**
   * ------------------------------------------------------------
   * GET BY ID
   * ------------------------------------------------------------
   * Devuelve un único componente por su id, o null si no existe.
   *
   * SQL equivalente:
   *   SELECT * FROM componentes WHERE id = $1;
   *
   * Aquí usamos $1 + [id] para:
   * - evitar SQL Injection
   * - permitir que el driver prepare correctamente la consulta
   *
   * Nota: id debería ser Number en la capa superior (app.js)
   * para evitar resultados raros si llega como string.
   */
  async getById(id) {
    // $1 es un placeholder: el valor real viene en el array [id]
    const result = await pool.query(
      `SELECT * FROM ${TABLE} WHERE id = $1`,
      [id]
    );

    /**
     * Si no hay filas, result.rows[0] sería undefined.
     * Devolvemos null para mantener contrato uniforme:
     * - Prisma findUnique() -> null si no existe
     */
    return result.rows[0] ?? null;
  },

  /**
   * ------------------------------------------------------------
   * CREATE
   * ------------------------------------------------------------
   * Inserta un nuevo componente y devuelve el registro creado.
   *
   * SQL equivalente:
   *   INSERT INTO componentes (nombre, tipo, marca, precio, stock)
   *   VALUES (...)
   *   RETURNING *;
   *
   * RETURNING * (PostgreSQL) es muy útil para:
   * - recuperar el id autogenerado
   * - devolver el objeto completo al cliente
   */
  async create(datos) {
    /**
     * Desestructuración del objeto de entrada.
     * Valores por defecto:
     * - marca = null  -> si no viene, se guarda null
     * - precio = 0    -> si no viene, 0
     * - stock = 0     -> si no viene, 0
     *
     * Esto evita undefined en BD y unifica el comportamiento.
     */
    const { nombre, tipo, marca = null, precio = 0, stock = 0 } = datos;

    /**
     * Ejecutamos el INSERT parametrizado:
     * - $1..$5 evitan inyección SQL
     * - el array mantiene el orden de los valores
     */
    const result = await pool.query(
      `INSERT INTO ${TABLE} (nombre, tipo, marca, precio, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, tipo, marca, precio, stock]
    );

    // Al insertar una fila, result.rows[0] es el registro creado.
    return result.rows[0];
  },

  /**
   * ------------------------------------------------------------
   * UPDATE (parcial) con SQL dinámico
   * ------------------------------------------------------------
   * Queremos un UPDATE parcial "tipo Prisma":
   * - Si un campo viene undefined -> NO se toca en BD
   * - Si viene con valor (incluso null) -> se actualiza a ese valor
   *
   * Por eso NO usamos COALESCE aquí.
   * Construimos un SET con solo los campos presentes.
   *
   * Ventaja:
   * - flexible
   * - evita pisar campos con valores por defecto
   *
   * Ojo didáctico:
   * - Generamos SQL dinámicamente, pero SOLO con nombres de columnas
   *   controlados por nosotros (nombre, tipo, marca, precio, stock).
   * - Los valores siguen yendo parametrizados ($1, $2, ...)
   */
  async update(id, datos) {
    // `fields` guardará trozos de SQL del tipo: "nombre = $1"
    const fields = [];

    // `values` guardará los valores reales para esos placeholders.
    const values = [];

    /**
     * `i` es el contador de placeholders ($1, $2, $3...).
     * Vamos incrementándolo cada vez que añadimos un campo.
     */
    let i = 1;

    /**
     * Si un campo viene definido (aunque sea null), lo incluimos.
     * Si viene undefined, lo ignoramos (update parcial real).
     */
    if (datos.nombre !== undefined) {
      fields.push(`nombre = $${i++}`);     // ejemplo: nombre = $1
      values.push(datos.nombre);           // values[0] = valor del nombre
    }

    if (datos.tipo !== undefined) {
      fields.push(`tipo = $${i++}`);       // tipo = $2
      values.push(datos.tipo);
    }

    if (datos.marca !== undefined) {
      fields.push(`marca = $${i++}`);      // marca = $3
      values.push(datos.marca);
    }

    if (datos.precio !== undefined) {
      fields.push(`precio = $${i++}`);     // precio = $4
      values.push(datos.precio);
    }

    if (datos.stock !== undefined) {
      fields.push(`stock = $${i++}`);      // stock = $5
      values.push(datos.stock);
    }

    /**
     * Si no hay campos que actualizar:
     * - no tiene sentido ejecutar un UPDATE vacío
     * - devolvemos el registro actual (o null si no existe)
     */
    if (fields.length === 0) return this.getById(id);

    /**
     * Ahora añadimos el id como último parámetro, porque lo usaremos
     * en el WHERE.
     *
     * Ejemplo:
     * - si actualizamos 3 campos, i valdrá 4
     * - entonces el WHERE será: id = $4
     */
    values.push(id);

    /**
     * Construimos la query final:
     * UPDATE componentes
     * SET nombre = $1, precio = $2
     * WHERE id = $3
     * RETURNING *;
     */
    const result = await pool.query(
      `UPDATE ${TABLE}
       SET ${fields.join(", ")}
       WHERE id = $${i}
       RETURNING *`,
      values
    );

    /**
     * Si no existe id, UPDATE no devuelve filas -> rows[0] undefined
     * devolvemos null para mantener contrato.
     */
    return result.rows[0] ?? null;
  },

  /**
   * ------------------------------------------------------------
   * REMOVE
   * ------------------------------------------------------------
   * Elimina por id y devuelve true/false según si se eliminó algo.
   *
   * SQL equivalente:
   *   DELETE FROM componentes WHERE id = $1 RETURNING id;
   *
   * - RETURNING id hace que PostgreSQL devuelva una fila si eliminó.
   * - result.rowCount > 0 indica cuántas filas fueron borradas.
   *
   * Contrato:
   * - true si existía y se borró
   * - false si no existía
   */
  async remove(id) {
    const result = await pool.query(
      `DELETE FROM ${TABLE} WHERE id = $1 RETURNING id`,
      [id]
    );

    // Si rowCount es 1, se borró; si 0, no existía.
    return result.rowCount > 0;
  },
};
