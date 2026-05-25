package com.broasteria.broasterbackend.repositories;

import com.broasteria.broasterbackend.models.TipoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoPagoRepository extends JpaRepository<TipoPago, Integer> {
}
