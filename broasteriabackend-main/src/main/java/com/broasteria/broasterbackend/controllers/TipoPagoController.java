package com.broasteria.broasterbackend.controllers;

import com.broasteria.broasterbackend.models.TipoPago;
import com.broasteria.broasterbackend.repositories.TipoPagoRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/tipos/pagos")
public class TipoPagoController {

    private final TipoPagoRepository repository;

    public TipoPagoController(TipoPagoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TipoPago> listar() {
        return repository.findAll();
    }
}
