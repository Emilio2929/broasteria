package com.broasteria.broasterbackend.controllers;

import com.broasteria.broasterbackend.models.TipoComprobantePago;
import com.broasteria.broasterbackend.repositories.TipoComprobantePagoRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/tipos/comprobantes")
public class TipoComprobanteController {

    private final TipoComprobantePagoRepository repository;

    public TipoComprobanteController(TipoComprobantePagoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TipoComprobantePago> listar() {
        return repository.findAll();
    }
}
