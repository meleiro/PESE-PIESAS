CREATE TABLE IF NOT EXISTS componentes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  marca VARCHAR(80),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);


INSERT INTO componentes (nombre, tipo, marca, precio, stock)
VALUES
('Ryzen 5 5600', 'CPU', 'AMD', 129.99, 12),
('Core i5-12400F', 'CPU', 'Intel', 149.99, 8),
('RTX 4060', 'GPU', 'NVIDIA', 299.99, 5),
('Samsung 970 EVO Plus 1TB', 'SSD', 'Samsung', 89.90, 20);
