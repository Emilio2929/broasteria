package com.broasteria.broasterbackend.repositories;

import com.broasteria.broasterbackend.models.SerieContador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SerieContadorRepository extends JpaRepository<SerieContador, Integer> {

    // Metodo para buscar la serie por su nombre
    Optional<SerieContador> findBySerie(String serie);
}