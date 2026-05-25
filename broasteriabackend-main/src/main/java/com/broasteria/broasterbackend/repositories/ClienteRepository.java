package com.broasteria.broasterbackend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.broasteria.broasterbackend.models.ClienteModel;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<ClienteModel, Integer> {

    Optional<ClienteModel> findByCorreo(String correo);

    Optional<ClienteModel> findByNumeroDocumento(String numeroDocumento);

    void deleteByCorreo(String correo);

    boolean existsByCorreo(String correo);

    boolean existsByNumeroDocumento(String numeroDocumento);
}