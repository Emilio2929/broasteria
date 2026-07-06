export interface CategoriaProducto {
    id: number;
    nombreCategoria?: string;
}

export interface Producto {
    id: number;
    nombre: string;
    precio: number;
    stock: number;
    categoria: CategoriaProducto;
    imagen?: string;
}
