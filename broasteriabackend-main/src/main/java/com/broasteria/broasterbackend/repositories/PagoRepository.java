package com.broasteria.broasterbackend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.broasteria.broasterbackend.models.PagoModel;

@Repository
public interface PagoRepository extends JpaRepository<PagoModel, Integer> {

    List<PagoModel> findByPedido_Id(Integer idPedido);

    List<PagoModel> findByPedido_Cliente_Id(Integer idCliente);

    PagoModel findTopByPedido_IdOrderByIdDesc(Integer idPedido);

    boolean existsByPedido_Id(Integer idPedido);
}
