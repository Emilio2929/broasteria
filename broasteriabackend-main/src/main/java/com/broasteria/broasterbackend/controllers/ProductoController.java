package com.broasteria.broasterbackend.controllers;

import com.broasteria.broasterbackend.models.ProductoModel;
import com.broasteria.broasterbackend.services.ProductoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoService service;

    public ProductoController(ProductoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductoModel> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public ProductoModel obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    // Busqueda de producto por ID para ver en los botones
    @GetMapping("/categoria/{idCategoria}")
    public List<ProductoModel> listarPorCategoria(@PathVariable Integer idCategoria) {
        return service.listarCategoria(idCategoria);
    }

    // Gerente
    // Listado de productos por categoria
    @GetMapping("/categoriaPro")
    public List<ProductoModel> obtenerProductosConCategoria() {
        return service.ListCatProducto();
    }

    // Eliminar
    @DeleteMapping("/borrar/{id}")
    public void borrar(@PathVariable Integer id) {
        service.BorrarProducto(id);
    }

    // Actualizar Pedidos
    @PutMapping("/Actualizar/{id}")
    public ProductoModel actualizarProducto(@PathVariable Integer id, @RequestBody ProductoModel productoActualizado) {
        ProductoModel producto = service.obtener(id);
        producto.setPrecio(productoActualizado.getPrecio());
        producto.setStock(productoActualizado.getStock());
        return service.actualizar(producto);
    }

    // Crear un nuevo Producto
    @PostMapping("/crear")
    public ProductoModel crear(@RequestBody ProductoModel producto) {
        return service.actualizar(producto);
    }
}
