package com.broasteria.broasterbackend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.broasteria.broasterbackend.models.DetallePedidoModel;

public interface DetallePedidoRepository extends JpaRepository<DetallePedidoModel, Integer> {
    List<DetallePedidoModel> findByPedidoId(Integer idPedido);

}
