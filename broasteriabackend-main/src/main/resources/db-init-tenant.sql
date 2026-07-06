CREATE TABLE IF NOT EXISTS tipo_documento (
  ID_TipoDocumento int NOT NULL,
  Nombre_Documento varchar(100) NOT NULL,
  PRIMARY KEY (ID_TipoDocumento)
);

INSERT IGNORE INTO tipo_documento (ID_TipoDocumento, Nombre_Documento) 
VALUES (1, 'DNI'), (2, 'CE');

CREATE TABLE IF NOT EXISTS cliente (
  ID_Cliente int NOT NULL AUTO_INCREMENT,
  Nombre varchar(100) NOT NULL,
  Apellido varchar(100) NOT NULL,
  Direccion varchar(100) NOT NULL,
  Telefono int NOT NULL,
  Numero_Documento varchar(100) NOT NULL,
  Correo varchar(100) NOT NULL,
  Contrasena varchar(100) NOT NULL,
  ID_TipoDocumento int NOT NULL,
  PRIMARY KEY (ID_Cliente),
  KEY fk_TipoDocumentodeCliente_idx (ID_TipoDocumento),
  CONSTRAINT fk_TipoDocumentodeCliente FOREIGN KEY (ID_TipoDocumento) REFERENCES tipo_documento (ID_TipoDocumento) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT IGNORE INTO cliente ( Nombre, Apellido, Direccion, Telefono, Numero_Documento, Correo, Contrasena, ID_TipoDocumento) VALUES
('Local', 'Mesero', 'local', 999999999, '00000000', 'mesero@gmail.com','$2a$12$n5utosZ6SURNWrtTpjIxqeLX/wuTh/MLDCuIeN10neF2KbVQFVvSe', 1);

CREATE TABLE IF NOT EXISTS estado_pedido (
  ID_EstadoPedido INT NOT NULL AUTO_INCREMENT,
  NombreEstado_Pedido VARCHAR(200) NOT NULL,
  PRIMARY KEY (ID_EstadoPedido)
);
         
INSERT IGNORE INTO estado_pedido (ID_EstadoPedido, NombreEstado_Pedido)
VALUES (1, 'Pendiente'),
	   (2, 'Preparando'),
       (3, 'Listo'),
	   (4, 'Cancelado'),
       (5, 'Completado'),
       (6, 'En camino');

CREATE TABLE IF NOT EXISTS categoria_producto (
  ID_CategoriaProducto int NOT NULL AUTO_INCREMENT,
  Nombre_Categoria varchar(200) NOT NULL,
  PRIMARY KEY (ID_CategoriaProducto)
);



CREATE TABLE IF NOT EXISTS producto (
  ID_Producto int NOT NULL AUTO_INCREMENT,
  Nombre varchar(200) NOT NULL,
  Precio double NOT NULL,
  Stock int NOT NULL,
  ID_CategoriaProducto int NOT NULL,
  PRIMARY KEY (ID_Producto),
  KEY ID_CategoriaProducto_idx (ID_CategoriaProducto),
  CONSTRAINT ID_CategoriaProducto FOREIGN KEY (ID_CategoriaProducto) REFERENCES categoria_producto (ID_CategoriaProducto) ON DELETE CASCADE ON UPDATE CASCADE
);



CREATE TABLE IF NOT EXISTS estado_empleado (
  ID_EstadoEmpleado INT NOT NULL AUTO_INCREMENT,
  Nombre_EstadoEmpleado VARCHAR(200) NOT NULL,
  PRIMARY KEY (ID_EstadoEmpleado)
);
  
INSERT IGNORE INTO estado_empleado (Nombre_EstadoEmpleado)
VALUES ('Activo'),('Inactivo');

CREATE TABLE IF NOT EXISTS rol (
  ID_Rol INT NOT NULL AUTO_INCREMENT,
  Nombre_Rol VARCHAR(200) NOT NULL,
  PRIMARY KEY (ID_Rol)
);
  
INSERT IGNORE INTO rol (Nombre_Rol)
VALUES ('Sistema'),
	   ('Administrador'),
	   ('Mesero'),
       ('Chef'),
       ('Cajero'),
       ('Delivery');

CREATE TABLE IF NOT EXISTS empleado (
  ID_Empleado int NOT NULL AUTO_INCREMENT,
  Nombre varchar(200) NOT NULL,
  Apellido varchar(200) NOT NULL,
  ID_Rol int NOT NULL,
  Usuario_Login varchar(200) NOT NULL,
  Contrasena_Hash varchar(200) NOT NULL,
  ID_Estado int NOT NULL,
  PRIMARY KEY (ID_Empleado),
  UNIQUE KEY Usuario_Login_UNIQUE (Usuario_Login),
  KEY fk_idRoldeEmpleado_idx (ID_Rol),
  KEY fk_idEstadoEmpleadodeEmpleado_idx (ID_Estado),
  CONSTRAINT fk_idEstadoEmpleadodeEmpleado FOREIGN KEY (ID_Estado) REFERENCES estado_empleado (ID_EstadoEmpleado) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_idRoldeEmpleado FOREIGN KEY (ID_Rol) REFERENCES rol (ID_Rol) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT IGNORE INTO empleado (Nombre, Apellido, ID_Rol, Usuario_Login, Contrasena_Hash, ID_Estado)
VALUES ('Sistema', 'Automático', 1, 'sistema','$2a$12$n5utosZ6SURNWrtTpjIxqeLX/wuTh/MLDCuIeN10neF2KbVQFVvSe', 1),
       ('Ben','Castilla', 2,'Administrador','$2a$12$n5utosZ6SURNWrtTpjIxqeLX/wuTh/MLDCuIeN10neF2KbVQFVvSe',2);
    
CREATE TABLE IF NOT EXISTS pedido ( 
  ID_Pedido INT NOT NULL AUTO_INCREMENT, 
  ID_Cliente INT NOT NULL, 
  Numero_Pedido_Cliente INT NULL, 
  Fecha_Pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  Total_Pedido DOUBLE NOT NULL, 
  ID_Estado_Pedido INT NOT NULL, 
  Direccion_Entrega VARCHAR(255) NULL,
  Referencia_Entrega VARCHAR(255) NULL,
  ID_Empleado INT NOT NULL, 
  PRIMARY KEY (ID_Pedido), 
  UNIQUE KEY ux_pedido_cliente_numero (ID_Cliente, Numero_Pedido_Cliente),
  CONSTRAINT fk_EstadoPedidodePedidos FOREIGN KEY (ID_Estado_Pedido) REFERENCES estado_pedido (ID_EstadoPedido) ON DELETE CASCADE ON UPDATE CASCADE, 
  CONSTRAINT fk_idEmpleadodeEmpleado FOREIGN KEY (ID_Empleado) REFERENCES empleado (ID_Empleado) ON DELETE CASCADE ON UPDATE CASCADE, 
  CONSTRAINT fk_ID_ClientedePedido FOREIGN KEY (ID_Cliente) REFERENCES cliente (ID_Cliente) ON DELETE CASCADE ON UPDATE CASCADE 
); 

CREATE TABLE IF NOT EXISTS detalle_pedido (
  ID_DetallePedido int NOT NULL AUTO_INCREMENT,
  ID_Producto int NOT NULL,
  ID_Pedido int NOT NULL,
  Cantidad int NOT NULL,
  Subtotal decimal(10,2) NOT NULL,
  Precio_Unitario decimal(10,2) NOT NULL,
  DetalleExtra VARCHAR(255) NULL,
  PRIMARY KEY (ID_DetallePedido),
  KEY fk_ID_PedidoconDetallePedido_idx (ID_Pedido),
  KEY fk_ID_ProductoconDetallePedido_idx (ID_Producto),
  CONSTRAINT fk_ID_PedidoconDetallePedido FOREIGN KEY (ID_Pedido) REFERENCES pedido (ID_Pedido) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ID_ProductoconDetallePedido FOREIGN KEY (ID_Producto) REFERENCES producto (ID_Producto) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tipo_pago (
  ID_TipoPago INT NOT NULL AUTO_INCREMENT,
  Nombre_TipoPago VARCHAR(200) NOT NULL,
  PRIMARY KEY (ID_TipoPago)
);
  
INSERT IGNORE INTO tipo_pago (Nombre_TipoPago)
VALUES 
('Efectivo'),
('Tarjeta'),
('Yape'),
('Plin');
    
CREATE TABLE IF NOT EXISTS serie_contador (
  ID_Serie INT NOT NULL AUTO_INCREMENT, 
  Serie VARCHAR(4) NOT NULL UNIQUE,      
  Ultimo_Numero INT NOT NULL DEFAULT 0,  
  PRIMARY KEY (ID_Serie)
);

INSERT IGNORE INTO serie_contador (Serie, Ultimo_Numero) VALUES
('BBB1', 7),
('FFF1', 0);

CREATE TABLE IF NOT EXISTS tipocomprobante_pago (
  ID_TipoComprobante INT NOT NULL AUTO_INCREMENT,
  Nombre_TipoComprobante VARCHAR(200) NOT NULL,
  ID_Serie INT NOT NULL,
  PRIMARY KEY (ID_TipoComprobante),
  KEY fk_SerieComprobante_idx (ID_Serie),
  CONSTRAINT fk_SerieComprobante 
    FOREIGN KEY (ID_Serie) 
    REFERENCES serie_contador (ID_Serie)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO tipocomprobante_pago (Nombre_TipoComprobante, ID_Serie)
SELECT 'Boleta', 1
WHERE NOT EXISTS (
  SELECT 1 FROM tipocomprobante_pago
  WHERE LOWER(TRIM(Nombre_TipoComprobante)) = 'boleta'
);

INSERT INTO tipocomprobante_pago (Nombre_TipoComprobante, ID_Serie)
SELECT 'Factura', 2
WHERE NOT EXISTS (
  SELECT 1 FROM tipocomprobante_pago
  WHERE LOWER(TRIM(Nombre_TipoComprobante)) = 'factura'
);
    
CREATE TABLE IF NOT EXISTS pago (
  ID_Pago int NOT NULL AUTO_INCREMENT,
  ID_Pedido int NOT NULL,
  Fecha_Pago datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Monto decimal(10,2) NOT NULL,
  ID_TipoComprobante int NOT NULL,
  ID_TipoPago int NOT NULL,
  Código_Autorizacion varchar(100) NOT NULL,
  Código_Transaccion varchar(100) NOT NULL,
  N°_Seguimiento varchar(200) NOT NULL,
  PRIMARY KEY (ID_Pago),
  KEY ID_Pedido_idx (ID_Pedido),
  KEY fk_TipoComprobantedePago_idx (ID_TipoComprobante),
  KEY fk_TipoPagodePago_idx (ID_TipoPago),
  CONSTRAINT fk_TipoComprobantedePago FOREIGN KEY (ID_TipoComprobante) REFERENCES tipocomprobante_pago (ID_TipoComprobante) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_TipoPagodePago FOREIGN KEY (ID_TipoPago) REFERENCES tipo_pago (ID_TipoPago) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ID_Pedido FOREIGN KEY (ID_Pedido) REFERENCES pedido (ID_Pedido) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_token (
    ID_Token INT NOT NULL AUTO_INCREMENT,
    Token VARCHAR(100) NOT NULL UNIQUE,
    ID_Cliente INT NOT NULL,
    Fecha_Expiracion DATETIME NOT NULL,
    Usado BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (ID_Token),
    CONSTRAINT fk_ID_ClientedeToken FOREIGN KEY (ID_Cliente) 
        REFERENCES cliente (ID_Cliente) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);
