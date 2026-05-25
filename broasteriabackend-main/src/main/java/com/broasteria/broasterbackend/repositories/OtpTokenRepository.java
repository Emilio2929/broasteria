package com.broasteria.broasterbackend.repositories;

import com.broasteria.broasterbackend.models.OtpToken;
import com.broasteria.broasterbackend.models.ClienteModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Integer> {

    // Buscar un token por su codigo
    Optional<OtpToken> findByToken(String token);

    List<OtpToken> findByCliente(ClienteModel cliente);
}