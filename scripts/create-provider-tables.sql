-- Tablas de precios por proveedor
-- Ejecutar: psql -d medicalbot -f scripts/create-provider-tables.sql

-- Tabla: proveedor_general
CREATE TABLE IF NOT EXISTS proveedor_general (
    code VARCHAR(50) PRIMARY KEY,
    product VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: proveedor_bogota
CREATE TABLE IF NOT EXISTS proveedor_bogota (
    code VARCHAR(50) PRIMARY KEY,
    product VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda por nombre (LIKE)
CREATE INDEX IF NOT EXISTS idx_proveedor_general_product ON proveedor_general(LOWER(product));
CREATE INDEX IF NOT EXISTS idx_proveedor_bogota_product ON proveedor_bogota(LOWER(product));

-- Comentarios
COMMENT ON TABLE proveedor_general IS 'Precios del proveedor general';
COMMENT ON TABLE proveedor_bogota IS 'Precios del proveedor Bogotá';
