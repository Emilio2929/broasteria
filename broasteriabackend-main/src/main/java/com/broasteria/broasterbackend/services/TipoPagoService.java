package com.broasteria.broasterbackend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import com.broasteria.broasterbackend.models.TipoPago;
import com.broasteria.broasterbackend.repositories.TipoPagoRepository;

@Service
public class TipoPagoService {
    @Autowired
    private TipoPagoRepository repo;

    public List<TipoPago> listar() {
        return repo.findAll();
    }
}
