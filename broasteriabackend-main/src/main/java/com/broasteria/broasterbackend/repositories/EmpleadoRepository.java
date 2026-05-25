package com.broasteria.broasterbackend.repositories;

import com.broasteria.broasterbackend.models.EmpleadoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<EmpleadoModel, Integer> {
    Optional<EmpleadoModel> findByUsuarioLogin(String usuarioLogin);
}
