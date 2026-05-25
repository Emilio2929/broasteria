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
