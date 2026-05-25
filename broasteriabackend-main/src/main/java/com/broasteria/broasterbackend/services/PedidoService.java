package com.broasteria.broasterbackend.services;

import com.broasteria.broasterbackend.dto.CrearPedidoRequest;
import com.broasteria.broasterbackend.models.*;
import com.broasteria.broasterbackend.repositories.*;
import com.broasteria.broasterbackend.repositories.PedidoRepository.GananciaProducto;
import com.broasteria.broasterbackend.repositories.PedidoRepository.ProMasVent;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final EstadoPedidoRepository estadoPedidoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PagoRepository pagoRepository;
    private final EmailService emailService;
    private final TipoPagoRepository tipoPagoRepository;
    private final TipoComprobantePagoRepository tipoComprobantePagoRepository;
    private final FacturaService facturaService;

    public PedidoService(PedidoRepository pedidoRepository,
            ClienteRepository clienteRepository,
            ProductoRepository productoRepository,
            DetallePedidoRepository detallePedidoRepository,
            EstadoPedidoRepository estadoPedidoRepository,
            EmpleadoRepository empleadoRepository,
            PagoRepository pagoRepository,
            EmailService emailService,
            TipoPagoRepository tipoPagoRepository,
            TipoComprobantePagoRepository tipoComprobantePagoRepository,
            FacturaService facturaService) {
        this.pedidoRepository = pedidoRepository;
        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
        this.estadoPedidoRepository = estadoPedidoRepository;
        this.empleadoRepository = empleadoRepository;
        this.pagoRepository = pagoRepository;
        this.emailService = emailService;
        this.tipoPagoRepository = tipoPagoRepository;
        this.tipoComprobantePagoRepository = tipoComprobantePagoRepository;
        this.facturaService = facturaService;
    }

    @Transactional
    public PedidoModel crearPedido(CrearPedidoRequest req) {
        ClienteModel cliente = clienteRepository.findById(req.getIdCliente())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no existe"));

        limpiarPedidosPendientesNiubiz(cliente.getId());

        Integer idEmpleado = (req.getIdEmpleado() != null) ? req.getIdEmpleado() : 1;
        EmpleadoModel empleado = empleadoRepository.findById(idEmpleado)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no existe"));

        EstadoPedido estadoPendiente = estadoPedidoRepository.findById(1)
                .orElseThrow(() -> new IllegalArgumentException("Estado Pendiente no existe"));

        boolean esPedidoWeb = (cliente.getId() != 1);
        if (esPedidoWeb) {
            if (req.getIdTipoPago() == null || req.getIdTipoComprobante() == null) {
                throw new IllegalArgumentException("Error: El pedido Web debe incluir datos de pago y comprobante.");
            }
        }

        // Crear Pedido
        Integer ultimoNumero = pedidoRepository.findMaxNumeroPedidoByClienteId(cliente.getId());
        int numeroPedidoCliente = (ultimoNumero != null ? ultimoNumero : 0) + 1;

        PedidoModel pedido = new PedidoModel();
        pedido.setCliente(cliente);
        pedido.setEmpleado(empleado);
        pedido.setEstado(estadoPendiente);
        pedido.setNumeroPedidoCliente(numeroPedidoCliente);
        pedido.setDireccionEntrega(req.getDireccionEntrega());
        pedido.setReferenciaEntrega(req.getReferenciaEntrega());

        if (pedido.getFechaPedido() == null) {
            pedido.setFechaPedido(LocalDateTime.now());
        }

        List<DetallePedidoModel> detalles = new ArrayList<>();
        double total = 0.0;

        for (CrearPedidoRequest.ItemCarrito item : req.getItems()) {
            if (item.getIdProducto() == null)
                throw new IllegalArgumentException("Error: idProducto es null");

            ProductoModel producto = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no existe: " + item.getIdProducto()));

            if (producto.getStock() < item.getCantidad()) {
                throw new IllegalArgumentException("Stock insuficiente para " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - item.getCantidad());
            productoRepository.save(producto);

            DetallePedidoModel det = new DetallePedidoModel();
            det.setPedido(pedido);
            det.setProducto(producto);
            det.setCantidad(item.getCantidad());
            det.setPrecioUnitario(producto.getPrecio());
            det.setSubtotal(producto.getPrecio() * item.getCantidad());
            det.setDetalleExtra(item.getDetalleExtra());

            total += det.getSubtotal();
            detalles.add(det);
        }

        pedido.setTotalPedido(total);
        pedido.setDetalles(detalles);

        PedidoModel pedidoGuardado = pedidoRepository.saveAndFlush(pedido);

        // GUARDAR PAGO
        if (esPedidoWeb) {
            TipoPago tipoPago = tipoPagoRepository.findById(req.getIdTipoPago())
                    .orElseThrow(() -> new IllegalArgumentException("Tipo de pago no válido"));

            PagoModel pago = new PagoModel();
            pago.setPedido(pedidoGuardado);
            pago.setTipoPago(tipoPago);
            pago.setTipoComprobante(tipoComprobantePagoRepository.findById(req.getIdTipoComprobante())
                    .orElseThrow(() -> new IllegalArgumentException("Tipo de comprobante no válido")));
            pago.setMonto(total);

            if (tipoPago.getId() == 2) {
                pago.setCodigoAutorizacion("PENDIENTE_NIUBIZ");
            } else {
                pago.setCodigoAutorizacion(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            }

            pago.setCodigoTransaccion(UUID.randomUUID().toString());
            pago.setNumeroSeguimiento("TRX-" + System.currentTimeMillis());

            pagoRepository.saveAndFlush(pago);

            String nombreMetodo = tipoPago.getNombreTipoPago();

            if (nombreMetodo.equalsIgnoreCase("Efectivo")) {
                enviarNotificacionPago(pedidoGuardado.getId());
            }
        }

        return pedidoGuardado;
    }

    // LIMPIA LA BASURA DE NIUBIZ
    private void limpiarPedidosPendientesNiubiz(Integer idCliente) {
        try {
            // Buscamos pagos de este cliente
            List<PagoModel> pagosCliente = pagoRepository.findByPedido_Cliente_Id(idCliente);

            for (PagoModel pago : pagosCliente) {
                // Si encontramos uno que se quedo en PENDIENTE_NIUBIZ
                if ("PENDIENTE_NIUBIZ".equals(pago.getCodigoAutorizacion())) {
                    System.out.println(">>> LIMPIANDO PEDIDO ABANDONADO ID: " + pago.getPedido().getId());

                    // devolvemos el stock de los productos
                    for (DetallePedidoModel det : pago.getPedido().getDetalles()) {
                        ProductoModel prod = det.getProducto();
                        prod.setStock(prod.getStock() + det.getCantidad());
                        productoRepository.save(prod);
                    }

                    // borramos el pago y el pedido
                    pagoRepository.delete(pago);
                    pedidoRepository.delete(pago.getPedido());
                }
            }
        } catch (Exception e) {
            System.err.println("Error limpiando pedidos pendientes: " + e.getMessage());
        }
    }

    // para enviar correos
    public void enviarNotificacionPago(Integer idPedido) {
        try {
            PedidoModel pedido = pedidoRepository.findById(idPedido).orElse(null);
            if (pedido == null)
                return;

            PagoModel pago = pagoRepository.findTopByPedido_IdOrderByIdDesc(idPedido);
            if (pago == null)
                return;

            // ESCUDO
            String codigoAuth = pago.getCodigoAutorizacion();
            if (codigoAuth != null && codigoAuth.contains("PENDIENTE")) {
                System.out.println(">>> [ESCUDO] Correo bloqueado. Pedido " + idPedido + " esperando pago.");
                return;
            }

            List<DetallePedidoModel> detalles = pedido.getDetalles();
            String nombreMetodo = pago.getTipoPago().getNombreTipoPago();
            Integer idTipoComprobante = pago.getTipoComprobante().getId();

            System.out.println(">>> ENVIANDO CORREO AHORA. Pedido: " + idPedido);

            if (nombreMetodo.equalsIgnoreCase("efectivo")) {
                enviarCorreoConfirmacionEfectivo(pedido, detalles);
            } else {
                facturaService.generarComprobante(pedido, detalles, idTipoComprobante, nombreMetodo);
            }
        } catch (Exception e) {
            System.err.println(">>> ERROR AL ENVIAR CORREO: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void enviarCorreoConfirmacionEfectivo(PedidoModel pedido, List<DetallePedidoModel> detalles) {
        String nombreCliente = pedido.getCliente().getNombre();
        String correoCliente = pedido.getCliente().getCorreo();
        String asunto = "¡Confirmación de Pedido #" + pedido.getNumeroPedidoCliente() + " - Pendiente de Pago!";

        StringBuilder cuerpo = new StringBuilder();
        cuerpo.append("¡Hola ").append(nombreCliente).append("\n\n");
        cuerpo.append("Hemos recibido tu pedido. **El pago se realizará al momento de la entrega (Efectivo).**\n\n");
        cuerpo.append(
                "========================================\n RESUMEN DE TU PEDIDO\n========================================\n\n");
        for (DetallePedidoModel det : detalles) {
            cuerpo.append("  - ").append(det.getProducto().getNombre()).append(" (x").append(det.getCantidad())
                    .append(") ... S/ ").append(String.format("%.2f", det.getSubtotal().doubleValue())).append("\n");
        }
        cuerpo.append("\nTotal a Pagar: S/ ").append(String.format("%.2f", pedido.getTotalPedido())).append("\n\n");
        cuerpo.append("Saludos,\nEl equipo de D'licias Fast Food");
        emailService.enviarCorreo(correoCliente, asunto, cuerpo.toString());
    }

    @Transactional
    public PedidoModel crearPedidoMesero(CrearPedidoRequest req) {
        req.setIdCliente(1);
        return crearPedido(req);
    }

    public List<PedidoModel> ListTotalPedidos() {
        return pedidoRepository.findAll();
    }

    public List<PedidoModel> listarPedidosParaChef() {
        List<PedidoModel> pedidos = pedidoRepository.findAll();
        pedidos.removeIf(p -> p.getEstado().getId() == 4 || p.getEstado().getId() == 5);
        return pedidos;
    }

    public List<PedidoModel> listarPedidosPorEmpleado(Integer idEmpleado) {
        List<PedidoModel> pedidos = pedidoRepository.findByEmpleadoIdEmpleadoOrderByFechaPedidoDesc(idEmpleado);
        pedidos.removeIf(p -> p.getEstado().getId() == 4 || p.getEstado().getId() == 5);
        return pedidos;
    }

    public List<PedidoModel> listarTodosLosPedidos() {
        return pedidoRepository.findAll();
    }

    // Filtro visual para el historial
    public List<PedidoModel> historialPorCliente(Integer idCliente) {
        List<PedidoModel> pedidos = pedidoRepository.findByClienteIdOrderByFechaPedidoDesc(idCliente);
        pedidos.removeIf(p -> {
            PagoModel pago = pagoRepository.findTopByPedido_IdOrderByIdDesc(p.getId());
            return pago != null && "PENDIENTE_NIUBIZ".equals(pago.getCodigoAutorizacion());
        });
        return pedidos;
    }

    public Optional<PedidoModel> BusquedaPorId(Integer id) {
        return pedidoRepository.findById(id);
    }

    @Transactional
    public PedidoModel completarPedido(Integer idPedido) {
        PedidoModel pedido = pedidoRepository.findById(idPedido).orElseThrow();
        pedido.setEstado(estadoPedidoRepository.findById(5).orElseThrow());
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public void finalizarPedido(Integer idPedido) {
        PedidoModel pedido = pedidoRepository.findById(idPedido).orElseThrow();
        if (pedido.getCliente().getId() == 1)
            throw new IllegalArgumentException("Solo para Pedidos WEB.");

        PagoModel pago = pagoRepository.findTopByPedido_IdOrderByIdDesc(idPedido);
        if (pago == null)
            throw new RuntimeException("No se encontró pago.");

        String tipoPago = pago.getTipoPago().getNombreTipoPago().toLowerCase();
        String tipoComp = pago.getTipoComprobante().getNombreTipoComprobante().toLowerCase();

        if (tipoPago.matches(".*(tarjeta|yape|plin).*") && !tipoComp.contains("nota")) {
            throw new IllegalArgumentException("Pago electrónico solo admite Nota de Venta.");
        }

        pedido.setEstado(estadoPedidoRepository.findById(5).orElseThrow());
        pedidoRepository.save(pedido);
    }

    @Transactional
    public void cancelarPedido(Integer idPedido) {
        PedidoModel pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (pedido.getEstado().getId() != 1) {
            throw new IllegalStateException("Solo se pueden cancelar pedidos en estado Pendiente.");
        }

        for (DetallePedidoModel detalle : pedido.getDetalles()) {
            ProductoModel prod = detalle.getProducto();
            prod.setStock(prod.getStock() + detalle.getCantidad());
            productoRepository.save(prod);
        }

        EstadoPedido estadoCancelado = estadoPedidoRepository.findById(4)
                .orElseThrow(() -> new IllegalArgumentException("Estado Cancelado no existe"));
        pedido.setEstado(estadoCancelado);
        pedidoRepository.saveAndFlush(pedido);

        try {
            enviarCorreoCancelacion(pedido);
            System.out.println(">>> Correo de cancelación enviado para el pedido #" + pedido.getNumeroPedidoCliente());
        } catch (Exception e) {
            System.err.println(">>> ERROR AL ENVIAR CORREO DE CANCELACIÓN: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void enviarCorreoCancelacion(PedidoModel pedido) {
        String nombreCliente = pedido.getCliente().getNombre();
        String correoCliente = pedido.getCliente().getCorreo();
        String asunto = "Pedido Cancelado - Orden #" + pedido.getNumeroPedidoCliente();

        StringBuilder cuerpo = new StringBuilder();
        cuerpo.append("Hola ").append(nombreCliente).append(",\n\n");
        cuerpo.append("Te confirmamos que tu pedido #").append(pedido.getNumeroPedidoCliente())
                .append(" ha sido CANCELADO correctamente.\n\n");
        cuerpo.append(
                "========================================\n DETALLE DEL PEDIDO CANCELADO\n========================================\n");
        for (DetallePedidoModel det : pedido.getDetalles()) {
            cuerpo.append("- ").append(det.getProducto().getNombre())
                    .append(" (x").append(det.getCantidad()).append(")\n");
        }
        cuerpo.append("\nTotal del Pedido: S/ ").append(String.format("%.2f", pedido.getTotalPedido())).append("\n");
        cuerpo.append(
                "NOTA: Si realizaste un pago con tarjeta o billetera digital, la devolución se procesará según las políticas del banco.\n\n");
        cuerpo.append("Esperamos verte pronto,\nEl equipo de D'licias Fast Food");

        emailService.enviarCorreo(correoCliente, asunto, cuerpo.toString());
    }

    @Transactional
    public void abandonarPedido(Integer idPedido) {
        PedidoModel pedido = pedidoRepository.findById(idPedido).orElseThrow();
        if (pedido.getEstado().getId() != 1)
            throw new IllegalStateException("Solo pendientes");
        for (DetallePedidoModel d : pedido.getDetalles()) {
            ProductoModel p = d.getProducto();
            p.setStock(p.getStock() + d.getCantidad());
            productoRepository.save(p);
        }
        detallePedidoRepository.deleteAll(pedido.getDetalles());
        pedidoRepository.delete(pedido);
    }

    @Transactional
    public PedidoModel cambiarEstadoPedido(Integer idPedido, Integer idEstado) {
        PedidoModel pedido = pedidoRepository.findById(idPedido).orElseThrow();
        pedido.setEstado(estadoPedidoRepository.findById(idEstado).orElseThrow());
        return pedidoRepository.save(pedido);
    }

    public PedidoModel buscarPorIdPedido(Integer idPedido) {
        return pedidoRepository.findById(idPedido).orElseThrow();
    }

    // Estadisticas
    //
    public List<PedidoModel> ListTotalPedidosCompletados(LocalDateTime inicio, LocalDateTime fin) {
        return pedidoRepository.findAllCompletado(inicio, fin);
    }

    // Ventas por Producto
    public List<GananciaProducto> obtGananciasPorProducto(LocalDateTime inicio, LocalDateTime fin) {
        return pedidoRepository.gananciasPorProducto(inicio, fin);
    }

    // Productos Vendidos
    public List<ProMasVent> ProdcMVendidos(LocalDateTime inicio, LocalDateTime fin) {
        return pedidoRepository.productosMasVendidos(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "cantidad")),
                inicio, fin);
    }

    public List<ProMasVent> ProdcMenosVendidos(LocalDateTime inicio, LocalDateTime fin) {
        return pedidoRepository.productosMasVendidos(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "cantidad")),
                inicio, fin);
    }

    // Comparacion de Ventas Mensuales
    public Map<String, Object> ComparacionMensual(int mes, int anio, int mes2, int anio2) {
        List<Object[]> DPL = pedidoRepository.comparacionVentasMensuales(mes, anio);
        List<Object[]> DSL = pedidoRepository.comparacionVentasMensuales(mes2, anio2);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("DPL", DPL);
        resultado.put("DSL", DSL);
        return resultado;
    }

    public List<Object[]> MesyAnio() {
        return pedidoRepository.mesAnio();
    }

    // delivery
    @Transactional
    public PedidoModel marcarEnCamino(Integer idPedido) {
        PedidoModel pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (pedido.getCliente().getId() == 1) {
            throw new IllegalArgumentException("El delivery no puede tomar pedidos de local.");
        }

        if (pedido.getEstado().getId() != 3) {
            throw new IllegalArgumentException("El pedido no está en estado 'Listo'.");
        }

        EstadoPedido enCamino = estadoPedidoRepository.findById(6)
                .orElseThrow(() -> new IllegalArgumentException("Estado 'En camino' no existe"));

        pedido.setEstado(enCamino);
        return pedidoRepository.save(pedido);
    }

    public List<PedidoModel> listarPedidosDelivery() {
        List<PedidoModel> pedidos = pedidoRepository.findAll();

        pedidos.removeIf(p -> p.getCliente().getId() == 1 ||
                (p.getEstado().getId() != 3 && p.getEstado().getId() != 6));

        return pedidos;
    }

    @Transactional
    public PedidoModel completarDeliveryValidandoDNI(Integer idPedido, String dniIngresado) {

        PedidoModel pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (pedido.getCliente().getId() == 1) {
            throw new IllegalArgumentException("Este pedido es de local. No se puede completar por delivery.");
        }

        if (pedido.getEstado().getId() != 6) {
            throw new IllegalArgumentException("El pedido no está en estado 'En camino'.");
        }

        String dniReal = pedido.getCliente().getNumeroDocumento();

        if (!dniReal.equals(dniIngresado)) {
            throw new IllegalArgumentException("El documento ingresado NO coincide con el cliente.");
        }

        EstadoPedido completado = estadoPedidoRepository.findById(5)
                .orElseThrow(() -> new IllegalArgumentException("Estado Completado no existe"));

        PagoModel pago = pagoRepository.findTopByPedido_IdOrderByIdDesc(idPedido);
        if (pago != null &&
                pago.getTipoPago().getNombreTipoPago().equalsIgnoreCase("Efectivo")) {

            TipoComprobantePago tipoComp = pago.getTipoComprobante();

            if (tipoComp != null) {
                System.out.println(">>> Generando comprobante por entrega con pago efectivo...");
                List<DetallePedidoModel> detalles = detallePedidoRepository.findByPedidoId(pedido.getId());
                facturaService.generarComprobante(
                        pedido,
                        detalles,
                        tipoComp.getId(),
                        pago.getTipoPago().getNombreTipoPago());

            }
        }

        pedido.setEstado(completado);
        return pedidoRepository.save(pedido);
    }
}
