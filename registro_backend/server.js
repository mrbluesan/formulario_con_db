// server.js

// --- Carga de Variables de Entorno ---
require('dotenv').config();

// --- Dependencias ---
const express = require('express');
const cors = require('cors'); // Para permitir peticiones de otros orígenes (frontend)
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Para hashear contraseñas
const dayjs = require('dayjs');  // Para manejar fechas

// --- Inicialización de Express ---
const app = express();
// Usa el puerto definido en .env o 3000 por defecto
const port = process.env.PORT || 3000;

// --- Configuración de CORS ---
// Permite que el frontend (ej. servido en otro puerto) se comunique con este backend
app.use(cors());

// --- Middlewares ---
// Parsea el cuerpo de las solicitudes entrantes como JSON
app.use(bodyParser.json());

// --- Configuración de la Base de Datos ---
// Lee las credenciales desde process.env (cargadas desde .env) el .env lo deje en /registro_backend
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'usuarios_db'
};

// --- Verificación de Variables de Entorno de BD ---
// Es importante que se carguen desde el .env
if (!dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.error("FATAL ERROR: Missing database credentials in .env file (DB_USER, DB_PASSWORD, DB_DATABASE)");
    // Detiene la aplicación si faltan credenciales críticas para evitar errores posteriores.
    process.exit(1);
}

// --- Rutas ---
app.get('/', (req, res) => {
    res.send('Servidor de registro funcionando!');
});

// Ruta para manejar el registro de usuarios
app.post('/register', async (req, res) => {
    console.log('Datos recibidos:', req.body);

    const {
        nombreCompleto, rut, fechaNacimiento, email, telefono,
        direccion, ciudad, region, password
    } = req.body;

    // Validación de campos obligatorios
    if (!nombreCompleto || !rut || !fechaNacimiento || !email || !telefono || !direccion || !ciudad || !region || !password) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    // Validar y formatear la fecha usando dayjs, lo hice de esta forma para evitar problemas de formato de fechas
    // El tercer argumento 'true' activa el modo estricto de parseo
    const fechaValida = dayjs(fechaNacimiento, 'YYYY-MM-DD', true).isValid();
    if (!fechaValida) {
        return res.status(400).json({ message: 'El formato de la fecha de nacimiento no es válido. Debe ser YYYY-MM-DD.' });
    }
    // Asegura el formato correcto para MySQL
    const fechaFormateada = dayjs(fechaNacimiento).format('YYYY-MM-DD');

    // Validación longitud contraseña
    if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    let connection;
    try {
        // Hashear la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        console.log('Password hasheada.');

        // Establecer conexión usando dbConfig
        connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a la base de datos MySQL.');

        // Preparar la consulta SQL
        const sql = `INSERT INTO registros
                    (nombre_completo, rut, fecha_nacimiento, email, telefono, direccion, ciudad, region, password_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            nombreCompleto, rut, fechaFormateada, email, telefono,
            direccion, ciudad, region, passwordHash
        ];

        // Ejecutar la consulta
        const [result] = await connection.execute(sql, values);
        console.log('Usuario registrado con ID:', result.insertId);

        // Enviar respuesta 
        res.status(201).json({ message: '¡Usuario registrado exitosamente!', userId: result.insertId });

    } catch (error) {
        console.error('Error al registrar el usuario:', error);

        // Manejo de errores específicos
        if (error.code === 'ER_DUP_ENTRY') {
            let duplicateField = 'dato';
            if (error.message.includes('rut')) duplicateField = 'RUT';
            if (error.message.includes('email')) duplicateField = 'Email';
            return res.status(409).json({ message: `Error: El ${duplicateField} ya está registrado.` });
        }
        
        if (error.code === 'ER_TRUNCATED_WRONG_VALUE' && error.message.includes('fecha_nacimiento')) {
            return res.status(400).json({ message: 'Error: El formato de la fecha de nacimiento no es válido para la base de datos.' });
        }
         // Errores comunes
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("Error de acceso a la base de datos. Verifica las credenciales en el archivo .env.");
            return res.status(500).json({ message: 'Error interno del servidor (configuración de BD).' });
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'){
            console.error(`Error de conexión a la base de datos en host ${dbConfig.host}. Verifica el host y que el servidor MySQL esté corriendo.`);
            return res.status(500).json({ message: 'Error interno del servidor (conexión BD).' });
        }

        // Error genérico
        res.status(500).json({ message: 'Error interno del servidor al procesar el registro.' });
    } finally {
        // Cerrar la conexión si se estableció
        if (connection) {
            await connection.end();
            console.log('Conexión a la base de datos cerrada.');
        }
    }
});

// --- Iniciar el servidor ---
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
