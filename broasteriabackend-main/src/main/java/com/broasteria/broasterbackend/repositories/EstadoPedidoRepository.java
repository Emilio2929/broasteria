package com.broasteria.broasterbackend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.broasteria.broasterbackend.models.EstadoPedido;

import java.util.Optional;

public interface EstadoPedidoRepository extends JpaRepository<EstadoPedido, Integer> {

    Optional<EstadoPedido> findByNombre(String nombre);

}
