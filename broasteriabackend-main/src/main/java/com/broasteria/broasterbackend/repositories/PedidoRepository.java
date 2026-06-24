package com.broasteria.broasterbackend.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.broasteria.broasterbackend.models.PedidoModel;

public interface PedidoRepository extends JpaRepository<PedidoModel, Integer> {
    List<PedidoModel> findByClienteIdOrderByFechaPedidoDesc(Integer idCliente);

    @Query("""
                SELECT
                    p.id AS id,
                    p.numeroPedidoCliente AS numeroPedidoCliente,
                    p.fechaPedido AS fechaPedido,
                    p.totalPedido AS totalPedido,
                    e.id AS estadoId,
                    e.nombre AS estadoNombre,
                    d.id AS detalleId,
                    d.cantidad AS cantidad,
                    d.subtotal AS subtotal,
                    d.detalleExtra AS detalleExtra,
                    pr.id AS productoId,
                    pr.nombre AS productoNombre
                FROM PedidoModel p
                JOIN p.estado e
                LEFT JOIN p.detalles d
                LEFT JOIN d.producto pr
                WHERE p.cliente.id = :idCliente
                AND NOT EXISTS (
                    SELECT 1 FROM PagoModel pago
                    WHERE pago.pedido = p
                    AND pago.codigoAutorizacion = 'PENDIENTE_NIUBIZ'
                )
                ORDER BY p.fechaPedido DESC, p.id DESC, d.id ASC
            """)
    List<HistorialPedidoRow> findHistorialVisibleRowsByClienteId(@Param("idCliente") Integer idCliente);

    interface HistorialPedidoRow {
        Integer getId();

        Integer getNumeroPedidoCliente();

        LocalDateTime getFechaPedido();

        Double getTotalPedido();

        Integer getEstadoId();

        String getEstadoNombre();

        Integer getDetalleId();

        Integer getCantidad();

        Double getSubtotal();

        String getDetalleExtra();

        Integer getProductoId();

        String getProductoNombre();
    }

    int countByClienteId(Integer idCliente);

    // Lista a todos los pedidos
    List<PedidoModel> findAll();

    List<PedidoModel> findByEmpleadoIdEmpleadoOrderByFechaPedidoDesc(Integer idEmpleado);

    Optional<PedidoModel> findById(Integer IdPedido);

    // Graficos
    @Query("""
                SELECT p FROM PedidoModel p
                JOIN p.estado e
                WHERE e.id = 5
                AND p.fechaPedido BETWEEN :inicio AND :fin
                ORDER BY p.fechaPedido DESC
            """)
    List<PedidoModel> findAllCompletado(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    public interface GananciaProducto {
        String getProducto();

        Double getTotalGanancia();
    }

    // Ventas por Producto
    @Query("""
                SELECT pr.nombre AS producto, SUM(dp.precioUnitario * dp.cantidad) AS totalGanancia
                FROM PedidoModel p
                JOIN p.detalles dp
                JOIN dp.producto pr
                WHERE p.estado.id = 5
                AND p.fechaPedido BETWEEN :inicio AND :fin
                GROUP BY pr.nombre
                ORDER BY SUM(dp.precioUnitario * dp.cantidad) desc
            """)
    List<GananciaProducto> gananciasPorProducto(@Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);

    // Productos mas Vendidos
    public interface ProMasVent {
        String getProducto();

        Double getCantidad();
    }

    @Query("""
                SELECT pr.nombre AS producto, SUM(dp.cantidad) AS cantidad
                FROM PedidoModel p
                JOIN p.detalles dp
                JOIN dp.producto pr
                WHERE p.estado.id = 5
                AND p.fechaPedido BETWEEN :inicio AND :fin
                GROUP BY pr.nombre
            """)
    List<ProMasVent> productosMasVendidos(Pageable pageable, @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);

    // Comparacion de Ventas Mensuales
    @Query("""
                SELECT DAY(p.fechaPedido), SUM(dp.precioUnitario * dp.cantidad)
                FROM PedidoModel p
                JOIN p.detalles dp
                WHERE p.estado.id = 5
                AND MONTH( p.fechaPedido) = :mes
                AND YEAR( p.fechaPedido) = :anio
                GROUP BY DAY(p.fechaPedido)
                ORDER BY DAY(p.fechaPedido)
            """)
    List<Object[]> comparacionVentasMensuales(@Param("mes") int mes, @Param("anio") int anio);

    @Query("""
            select distinct year(p.fechaPedido) as anio, month(p.fechaPedido) as mes
            from PedidoModel p
            where p.estado.id = 5
            order by anio, mes asc
            """)
    List<Object[]> mesAnio();

    @Query("SELECT MAX(p.numeroPedidoCliente) FROM PedidoModel p WHERE p.cliente.id = :idCliente")
    Integer findMaxNumeroPedidoByClienteId(Integer idCliente);

}
