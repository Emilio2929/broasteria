package com.broasteria.broasterbackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.broasteria.broasterbackend.models.PagoModel;
import com.broasteria.broasterbackend.services.PagoService;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import jakarta.servlet.http.HttpServletResponse;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/pagos")
public class PagoController {
    @Autowired
    private PagoService service;

    @PostMapping("/crear")
    public PagoModel crearPago(@RequestBody PagoModel pago) {
        return service.guardar(pago);
    }

    // ENDPOINTS NIUBIZ

    // Iniciar sesión de pago
    @GetMapping("/niubiz/iniciar/{monto}")
    public ResponseEntity<?> iniciarPagoNiubiz(@PathVariable Double monto) {
        String sessionKey = service.crearSesionNiubiz(monto);

        if (sessionKey != null) {
            Map<String, String> response = new HashMap<>();
            response.put("sessionKey", sessionKey);
            response.put("merchantId", "456879852"); // ID de Sandbox
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(500).body("Error al conectar con pasarela Niubiz");
        }
    }

    // Confirmar pago
    @PostMapping("/niubiz/confirmar")
    public ResponseEntity<?> confirmarPagoNiubiz(@RequestBody Map<String, Object> payload) {
        try {
            Integer idPedido = Integer.parseInt(payload.get("idPedido").toString());
            String transactionId = payload.get("transactionToken").toString();
            String metodoPago = "Tarjeta/Yape"; // Niubiz Web

            PagoModel pagoConfirmado = service.confirmarPagoNiubiz(idPedido, transactionId, metodoPago);
            return ResponseEntity.ok(pagoConfirmado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error confirmando pago en BD: " + e.getMessage());
        }
    }

    // ENDPOINT PARA REDIRECCION
    @PostMapping(value = "/niubiz/finalizar")
    public void finalizarPagoNiubizForm(@RequestParam Map<String, String> params, HttpServletResponse response)
            throws IOException {

        System.out.println(">>> NIUBIZ CALLBACK RECIBIDO. Parametros: " + params);

        try {
            String token = params.get("transactionToken");

            // RECUPERAR EL ID DE DOS FORMAS
            String purchaseNumber = params.get("purchasenumber");
            String idPropio = params.get("idPedidoPropio");

            Integer idPedido = null;

            if (idPropio != null) {
                idPedido = Integer.parseInt(idPropio);
                System.out.println(">>> ID PEDIDO RECUPERADO DE URL PROPIA: " + idPedido);
            } else if (purchaseNumber != null) {
                idPedido = Integer.parseInt(purchaseNumber);
                System.out.println(">>> ID PEDIDO RECUPERADO DE NIUBIZ: " + idPedido);
            }

            if (token != null && idPedido != null) {
                System.out.println(">>> PROCESANDO PAGO...");
                service.confirmarPagoNiubiz(idPedido, token, "Tarjeta/Yape");
                System.out.println(">>> PAGO COMPLETADO Y CORREO ENVIADO.");
            } else {
                System.err.println(">>> ERROE: Sigue faltando el ID del pedido o el Token.");
            }

            response.sendRedirect("http://localhost:4200/historial?limpiar=true");

        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect("http://localhost:4200/carrito?error=true");
        }
    }

    @GetMapping
    public List<PagoModel> listarPagos() {
        return service.listar();
    }

    @GetMapping("/porPedido/{idPedido}")
    public List<PagoModel> listarPorPedido(@PathVariable Integer idPedido) {
        return service.listarPorPedido(idPedido);
    }

    @GetMapping("/porCliente/{idCliente}")
    public List<PagoModel> listarPorCliente(@PathVariable Integer idCliente) {
        return service.listarPorCliente(idCliente);
    }

    @GetMapping("/imprimir/{idPedido}/{idTipoComprobante}")
    public ResponseEntity<String> imprimirComprobante(
            @PathVariable Integer idPedido,
            @PathVariable Integer idTipoComprobante,
            @RequestParam String metodoPago) {

        String pdfUrl = service.obtenerComprobanteUrl(idPedido, idTipoComprobante, metodoPago);

        if (pdfUrl == null || pdfUrl.isEmpty()) {
            System.err.println("No se generó el comprobante para pedido " + idPedido);
            return ResponseEntity.status(500).body("No se pudo generar el comprobante.");
        }

        System.out.println("PDF generado correctamente: " + pdfUrl);
        return ResponseEntity.ok(pdfUrl);
    }
}
