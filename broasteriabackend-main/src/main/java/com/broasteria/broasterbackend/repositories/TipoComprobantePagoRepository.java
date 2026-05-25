package com.broasteria.broasterbackend.repositories;

import com.broasteria.broasterbackend.models.TipoComprobantePago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoComprobantePagoRepository extends JpaRepository<TipoComprobantePago, Integer> {
}
