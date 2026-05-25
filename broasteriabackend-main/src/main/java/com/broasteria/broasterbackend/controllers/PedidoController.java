package com.broasteria.broasterbackend.controllers;

import com.broasteria.broasterbackend.dto.CrearPedidoRequest;
import com.broasteria.broasterbackend.models.PedidoModel;
import com.broasteria.broasterbackend.repositories.PedidoRepository.GananciaProducto;
import com.broasteria.broasterbackend.repositories.PedidoRepository.ProMasVent;
import com.broasteria.broasterbackend.services.PedidoService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/pedidos")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    // Crear pedido con pago simultaneo ===
    @PostMapping("/crear")
    public ResponseEntity<?> crearPedido(@RequestBody CrearPedidoRequest req) {
        try {
            PedidoModel nuevoPedido = service.crearPedido(req);
            // Envío de correo en segundo plano
            try {
                service.enviarNotificacionPago(nuevoPedido.getId());
            } catch (Exception e) {
                System.err.println("Advertencia: Fallo envio correo: " + e.getMessage());
            }
            return ResponseEntity.ok(nuevoPedido);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    // Crear pedido
    @PostMapping("/crearMesero")
    public PedidoModel crearPedidoM(@RequestBody CrearPedidoRequest req) {
        return service.crearPedidoMesero(req);
    }

    @GetMapping("/ListPedidos")
    public List<PedidoModel> ListPedidos() {
        return service.ListTotalPedidos();
    }

    @GetMapping("/historial/{idCliente}")
    public List<PedidoModel> historial(@PathVariable Integer idCliente) {
        return service.historialPorCliente(idCliente);
    }

    @PutMapping("/cancelar/{idPedido}")
    public void cancelarPedido(@PathVariable Integer idPedido) {
        service.cancelarPedido(idPedido);
    }

    @GetMapping
    public List<PedidoModel> listarTodos() {
        return service.listarTodosLosPedidos();
    }

    @DeleteMapping("/abandonar/{idPedido}")
    public void abandonarPedido(@PathVariable Integer idPedido) {
        service.abandonarPedido(idPedido);
    }

    @GetMapping("/chef")
    public ResponseEntity<List<PedidoModel>> listarPedidosParaChef() {
        return ResponseEntity.ok(service.listarPedidosParaChef());
    }

    @GetMapping("/empleado/{idEmpleado}")
    public ResponseEntity<List<PedidoModel>> listarPorEmpleado(@PathVariable Integer idEmpleado) {
        return ResponseEntity.ok(service.listarPedidosPorEmpleado(idEmpleado));
    }

    @GetMapping("/buscarPe/{IdPedido}")
    public Optional<PedidoModel> BuscarPedido(@PathVariable Integer IdPedido) {
        return service.BusquedaPorId(IdPedido);
    }

    @PutMapping("/cambiarEstado/{idPedido}/{idEstado}")
    public PedidoModel cambiarEstado(@PathVariable Integer idPedido, @PathVariable Integer idEstado) {
        return service.cambiarEstadoPedido(idPedido, idEstado);
    }

    @GetMapping("/buscar/{idPedido}")
    public PedidoModel buscarPorId(@PathVariable Integer idPedido) {
        return service.buscarPorIdPedido(idPedido);
    }

    @PutMapping("/completar/{idPedido}")
    public ResponseEntity<?> completarPedido(@PathVariable Integer idPedido) {
        try {
            return ResponseEntity.ok(service.completarPedido(idPedido));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/finalizar/{idPedido}")
    public ResponseEntity<?> finalizarPedido(@PathVariable("idPedido") Integer idPedido) {
        try {
            service.finalizarPedido(idPedido);
            return ResponseEntity.ok("Pedido finalizado correctamente.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Graficos

    // Lista todos los pedidos completados
    @GetMapping("/Completado")
    public List<PedidoModel> listComppletados(@RequestParam String fechaInicio, @RequestParam String fechaFin) {
        LocalDateTime inicio = LocalDate.parse(fechaInicio).atStartOfDay();
        LocalDateTime fin = LocalDate.parse(fechaFin).atTime(23, 59, 59);
        return service.ListTotalPedidosCompletados(inicio, fin);
    }

    // Ventas por Producto
    @GetMapping("/VentaPorProduc")
    public List<GananciaProducto> gananciasPorProducto(@RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        LocalDateTime inicio = LocalDate.parse(fechaInicio).atStartOfDay();
        LocalDateTime fin = LocalDate.parse(fechaFin).atTime(23, 59, 59);
        return service.obtGananciasPorProducto(inicio, fin);
    }

    // Productos mas Vendidos
    @GetMapping("/ProMV")
    public List<ProMasVent> ProdcMasVendidos(@RequestParam String fechaInicio, @RequestParam String fechaFin) {
        LocalDateTime inicio = LocalDate.parse(fechaInicio).atStartOfDay();
        LocalDateTime fin = LocalDate.parse(fechaFin).atTime(23, 59, 59);
        return service.ProdcMVendidos(inicio, fin);
    }

    @GetMapping("/ProMenV")
    public List<ProMasVent> ProdcMenosVendidos(@RequestParam String fechaInicio, @RequestParam String fechaFin) {
        LocalDateTime inicio = LocalDate.parse(fechaInicio).atStartOfDay();
        LocalDateTime fin = LocalDate.parse(fechaFin).atTime(23, 59, 59);
        return service.ProdcMenosVendidos(inicio, fin);
    }

    // Comparacion de Ventas Mensuales
    @GetMapping("/CompVentasMensuales")
    public Map<String, Object> comparacionVentasMensuales(@RequestParam int mes, @RequestParam int anio,
            @RequestParam int mes2, @RequestParam int anio2) {
        return service.ComparacionMensual(mes, anio, mes2, anio2);
    }

    @GetMapping("/mesAnio")
    public List<Object[]> mesAnio() {
        return service.MesyAnio();
    }
    // delivery

    @GetMapping("/delivery")
    public ResponseEntity<List<PedidoModel>> listarPedidosDelivery() {
        return ResponseEntity.ok(service.listarPedidosDelivery());
    }

    @PutMapping("/en-camino/{idPedido}")
    public ResponseEntity<?> marcarEnCamino(@PathVariable Integer idPedido) {
        try {
            return ResponseEntity.ok(service.marcarEnCamino(idPedido));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/validar-dni-delivery/{idPedido}")
    public ResponseEntity<?> completarDeliveryValidandoDNI(
            @PathVariable Integer idPedido,
            @RequestParam String dniIngresado) {

        try {
            return ResponseEntity.ok(service.completarDeliveryValidandoDNI(idPedido, dniIngresado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}