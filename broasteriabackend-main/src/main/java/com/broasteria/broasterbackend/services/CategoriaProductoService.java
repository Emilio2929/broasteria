package com.broasteria.broasterbackend.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.broasteria.broasterbackend.models.CategoriaProducto;
import com.broasteria.broasterbackend.repositories.CategoriaProductoRepository;

@Service
public class CategoriaProductoService {
    private CategoriaProductoRepository categoriaProRepo;

    public CategoriaProductoService(CategoriaProductoRepository categoriaProRepo) {
        this.categoriaProRepo = categoriaProRepo;
    }

    // lista la Categoria
    public List<CategoriaProducto> listarCategorias() {
        return categoriaProRepo.findAll();
    }
}
