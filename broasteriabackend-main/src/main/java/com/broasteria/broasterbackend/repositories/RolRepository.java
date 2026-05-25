package com.broasteria.broasterbackend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.broasteria.broasterbackend.models.RolModel;

@Repository
public interface RolRepository extends JpaRepository<RolModel, Integer> {
}