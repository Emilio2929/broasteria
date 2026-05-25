package com.broasteria.broasterbackend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.broasteria.broasterbackend.models.TipoDocumento;
import java.util.Optional;

@Repository
public interface TipoDocumentoRepository extends JpaRepository<TipoDocumento, Integer> {

    // Buscar por nombre de documento
    Optional<TipoDocumento> findByNombreDocumento(String nombreDocumento);

    // Eliminar por nombre de documento
    void deleteByNombreDocumento(String nombreDocumento);
}
