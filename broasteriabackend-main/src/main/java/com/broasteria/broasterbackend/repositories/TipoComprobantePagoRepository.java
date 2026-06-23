package com.broasteria.broasterbackend.repositories;

import com.broasteria.broasterbackend.models.TipoComprobantePago;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoComprobantePagoRepository extends JpaRepository<TipoComprobantePago, Integer> {
    @Query(value = """
            SELECT t.*
            FROM tipocomprobante_pago t
            INNER JOIN (
                SELECT MIN(ID_TipoComprobante) AS id
                FROM tipocomprobante_pago
                GROUP BY LOWER(TRIM(Nombre_TipoComprobante))
            ) canonical ON canonical.id = t.ID_TipoComprobante
            ORDER BY t.ID_TipoComprobante
            """, nativeQuery = true)
    List<TipoComprobantePago> findCanonicalTypes();
}
