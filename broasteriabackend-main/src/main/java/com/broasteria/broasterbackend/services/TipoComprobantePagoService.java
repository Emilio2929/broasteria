package com.broasteria.broasterbackend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import com.broasteria.broasterbackend.models.TipoComprobantePago;
import com.broasteria.broasterbackend.repositories.TipoComprobantePagoRepository;

@Service
public class TipoComprobantePagoService {
    @Autowired
    private TipoComprobantePagoRepository repo;

    public List<TipoComprobantePago> listar() {
        return repo.findAll();
    }
}
