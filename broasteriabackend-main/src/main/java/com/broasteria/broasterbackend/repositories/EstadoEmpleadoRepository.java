package com.broasteria.broasterbackend.repositories;

import com.broasteria.broasterbackend.models.EstadoEmpleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EstadoEmpleadoRepository extends JpaRepository<EstadoEmpleado, Integer> {
}
