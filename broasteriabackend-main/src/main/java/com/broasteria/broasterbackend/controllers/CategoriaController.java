package com.broasteria.broasterbackend.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.broasteria.broasterbackend.models.CategoriaProducto;
import com.broasteria.broasterbackend.services.CategoriaProductoService;
import org.springframework.web.bind.annotation.GetMapping;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/categorias")
public class CategoriaController {
    private final CategoriaProductoService categoService;

    public CategoriaController(CategoriaProductoService categoriaProductoService) {
        this.categoService = categoriaProductoService;
    }

    @GetMapping("/listarCategoria")
    public List<CategoriaProducto> listarCategoria() {
        return categoService.listarCategorias();
    }

}
