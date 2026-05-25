package com.broasteria.broasterbackend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.broasteria.broasterbackend.models.CategoriaProducto;

public interface CategoriaProductoRepository extends JpaRepository<CategoriaProducto, Integer> {

    // Solicita todas las categorias
    List<CategoriaProducto> findAll();
}
