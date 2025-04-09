# crear base de datos


CREATE DATABASE IF NOT EXISTS usuarios_db;
USE usuarios_db;
CREATE TABLE registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);
