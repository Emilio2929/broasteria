package com.broasteria.broasterbackend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.broasteria.broasterbackend.models.CategoriaProducto;
import com.broasteria.broasterbackend.models.ProductoModel;

public interface ProductoRepository extends JpaRepository<ProductoModel, Integer> {

    // Obtiene productos por Id de categoria
    List<ProductoModel> findByCategoria(CategoriaProducto categoria);

    // Listar todos los productos
    List<ProductoModel> findAll();

    // Eliminar productos
    void deleteById(Integer id);
}
