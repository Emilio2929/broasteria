package com.broasteria.broasterbackend.services;

import com.broasteria.broasterbackend.models.CategoriaProducto;
import com.broasteria.broasterbackend.models.ProductoModel;
import com.broasteria.broasterbackend.repositories.CategoriaProductoRepository;
import com.broasteria.broasterbackend.repositories.ProductoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository repo;

    @Autowired
    private final CategoriaProductoRepository categoriaRepo;

    public ProductoService(ProductoRepository repo, CategoriaProductoRepository categoriaRepo) {
        this.repo = repo;
        this.categoriaRepo = categoriaRepo;
    }

    public List<ProductoModel> listar() {
        return repo.findAll();
    }

    public ProductoModel obtener(Integer id) {
        return repo.findById(id).orElseThrow();
    }

    // Lista por Categoria
    public List<ProductoModel> listarCategoria(Integer idCategoria) {
        CategoriaProducto categoria = categoriaRepo.findById(idCategoria).orElse(null);
        if (categoria == null) {
            return List.of();
        }
        return repo.findByCategoria(categoria);
    }

    // Gerente
    // Listar Categoria por Producto
    public List<ProductoModel> ListCatProducto() {
        return repo.findAll();
    }

    // Eliminar propducto
    public void BorrarProducto(Integer id) {
        repo.deleteById(id);
    }

    // Actualizar o guardar
    public ProductoModel actualizar(ProductoModel producto) {
        return repo.save(producto);
    }
}
