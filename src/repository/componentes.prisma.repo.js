/**
 * Importamos el cliente de Prisma.
 * 
 * prismaClient es una instancia de PrismaClient, que es el ORM.
 * A partir de este objeto accedemos a los modelos que representan
 * las tablas de la base de datos.
 */
const prisma = require("../prismaClient");

/**
 * Seleccionamos el modelo con el que vamos a trabajar.
 * 
 * `prisma.componentes` representa la tabla "componentes" de la BD,
 * pero convertida en un objeto JavaScript con métodos (findMany,
 * create, update, delete, etc.).
 * 
 * En ORM NO trabajamos con SQL, trabajamos con modelos.
 */
const model = prisma.componentes;

/**
 * Exportamos un objeto que actúa como REPOSITORIO / DAO con ORM.
 * 
 * Desde fuera, la aplicación no sabe si aquí hay SQL o Prisma:
 * simplemente llama a métodos como getAll(), create(), update(), etc.
 */
module.exports = {

    /**
     * Devuelve TODOS los registros de la tabla componentes.
     * 
     * - findMany() equivale a un SELECT * FROM componentes
     * - orderBy se traduce a un ORDER BY en SQL
     * 
     * Prisma se encarga de generar la consulta SQL correcta.
     */
    async getAll() {
        return model.findMany({
            orderBy: { id: "asc" }   // ORDER BY id ASC
        });
    },

    /**
     * Devuelve un único componente por su id.
     * 
     * - findUnique() se usa cuando el campo es clave primaria
     * - where define la condición de búsqueda
     * 
     * Si no existe el registro, devuelve null (no lanza error).
     */
    async getById(id) {
        return model.findUnique({
            where: { id }
        });
    },

    /**
     * Inserta un nuevo componente en la base de datos.
     * 
     * Recibe un objeto `datos` con la información a insertar.
     * Se usan valores por defecto para evitar nulls no deseados.
     */
    async create(datos) {

        /**
         * Desestructuración del objeto de entrada.
         * 
         * - nombre y tipo se esperan obligatorios
         * - marca puede ser null
         * - precio y stock tienen valores por defecto
         * 
         * Esto evita errores y hace el código más robusto.
         */
        const {
            nombre,
            tipo,
            marca = null,
            precio = 0,
            stock = 0
        } = datos;

        /**
         * create() equivale a un INSERT INTO.
         * 
         * data contiene los campos de la tabla y sus valores.
         * Prisma valida:
         * - tipos
         * - campos obligatorios
         * - restricciones definidas en el schema
         */
        return model.create({
            data: {
                nombre,
                tipo,
                marca,
                precio,
                stock
            }
        });
    },

    /**
     * Actualiza un componente existente.
     * 
     * IMPORTANTE:
     * Prisma NO usa COALESCE como en SQL.
     * Para hacer una actualización parcial, simplemente
     * NO incluimos los campos que no queremos modificar.
     */
    async update(id, datos) {

        /**
         * payload será el objeto final que se enviará a Prisma.
         * Solo contendrá los campos que el usuario quiere cambiar.
         */
        const payload = {};

        /**
         * Comprobamos cada campo.
         * 
         * - Usamos !== undefined (no null)
         * - Esto permite actualizar a null si se desea
         * 
         * Si el campo no viene en datos, NO se añade al payload,
         * y Prisma NO lo modifica en la base de datos.
         */
        if (datos.nombre !== undefined) payload.nombre = datos.nombre;
        if (datos.tipo !== undefined) payload.tipo = datos.tipo;
        if (datos.precio !== undefined) payload.precio = datos.precio;
        if (datos.stock !== undefined) payload.stock = datos.stock;
        if (datos.marca !== undefined) payload.marca = datos.marca;

        /**
         * update() equivale a un UPDATE ... WHERE id = ?
         * 
         * - where indica qué registro se actualiza
         * - data contiene SOLO los campos a modificar
         * 
         * Si el id no existe, Prisma lanza una excepción.
         */
        return model.update({
            where: { id },
            data: payload
        });
    },

    /**
     * Elimina un componente por id.
     * 
     * delete() equivale a un DELETE FROM ... WHERE id = ?
     * 
     * Si el registro no existe, Prisma lanza un error.
     * Por eso normalmente se controla antes en la capa superior.
     */
    async remove(id) {
        await model.delete({
            where: { id }
        });

        /**
         * Devolvemos true para mantener compatibilidad
         * con la capa de servicio/controlador.
         */
        return true;
    }
};
