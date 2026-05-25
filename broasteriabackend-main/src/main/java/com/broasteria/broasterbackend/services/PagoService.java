package com.broasteria.broasterbackend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import com.broasteria.broasterbackend.models.*;
import com.broasteria.broasterbackend.repositories.*;

@Service
public class PagoService {

    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private TipoPagoRepository tipoPagoRepository;
    @Autowired
    private TipoComprobantePagoRepository tipoComprobantePagoRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private DetallePedidoRepository detallePedidoRepository;
    @Autowired
    private FacturaService facturaService;

    private final Random random = new Random();

    @Value("${niubiz.url.security}")
    private String urlSecurity;
    @Value("${niubiz.url.session}")
    private String urlSession;
    @Value("${niubiz.merchant.id}")
    private String merchantId;
    @Value("${niubiz.user}")
    private String user;
    @Value("${niubiz.password}")
    private String password;

    // --- OBTENER TOKEN DE SEGURIDAD ---
    private String getSecurityToken() {
        try {
            System.out.println(">>> CONECTANDO A NIUBIZ SECURITY: " + urlSecurity);
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            String auth = user + ":" + password;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
            headers.set("Authorization", "Basic " + encodedAuth);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(urlSecurity, HttpMethod.POST, entity, String.class);
            return response.getBody();
        } catch (Exception e) {
            System.err.println(">>> ERROR CRÍTICO AL OBTENER TOKEN SEGURIDAD: " + e.getMessage());
            e.printStackTrace(); // Ver el error completo en consola
            return null;
        }
    }

    // --- CREAR SESIÓN DE PAGO ---
    public String crearSesionNiubiz(Double monto) {
        try {
            String token = getSecurityToken();
            if (token == null) {
                System.err.println(">>> NO SE PUDO OBTENER EL TOKEN DE SEGURIDAD. ABORTANDO.");
                return null;
            }

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("channel", "web");
            body.put("amount", monto);

            // Antifraude básico para Sandbox
            Map<String, Object> antifraud = new HashMap<>();
            antifraud.put("clientIp", "127.0.0.1");
            Map<String, String> merchantData = new HashMap<>();
            merchantData.put("MDD4", user);
            antifraud.put("merchantDefineData", merchantData);
            body.put("antifraud", antifraud);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // Construcción y validación de URL
            String urlCompleta = urlSession + merchantId;
            System.out.println(">>> CREANDO SESIÓN EN URL: " + urlCompleta);

            ResponseEntity<Map> response = restTemplate.exchange(urlCompleta, HttpMethod.POST, entity, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("sessionKey")) {
                System.out.println(">>> SESIÓN NIUBIZ CREADA EXITOSAMENTE.");
                return response.getBody().get("sessionKey").toString();
            }
        } catch (Exception e) {
            System.err.println(">>> ERROR AL CREAR SESIÓN NIUBIZ: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    // --- CONFIRMAR PAGO ---
    @Transactional
    public PagoModel confirmarPagoNiubiz(Integer idPedido, String transactionId, String metodoPagoNombre) {
        System.out.println(">>> INICIANDO CONFIRMACION PAGO NIUBIZ PARA PEDIDO: " + idPedido);

        PagoModel pago = pagoRepository.findTopByPedido_IdOrderByIdDesc(idPedido);
        if (pago == null)
            throw new RuntimeException("No se encontró el registro de pago inicial");

        pago.setCodigoTransaccion(transactionId);
        pago.setCodigoAutorizacion("APROBADO");
        pago.setNumeroSeguimiento("NIUBIZ-" + System.currentTimeMillis());

        PedidoModel pedido = pago.getPedido();
        pago = pagoRepository.saveAndFlush(pago);

        try {
            List<DetallePedidoModel> detalles = detallePedidoRepository.findByPedidoId(pedido.getId());
            facturaService.generarComprobante(pedido, detalles, pago.getTipoComprobante().getId(), metodoPagoNombre);
        } catch (Exception e) {
            System.err.println(">>> ERROR CORREO POST-PAGO: " + e.getMessage());
        }

        return pago;
    }

    // Generar ID Único para evitar error de duplicados en Sandbox
    public String generarIdPedidoUnico(Integer idPedidoOriginal) {
        // Devuelve algo como: "25-1748239"
        return idPedidoOriginal + "-" + System.currentTimeMillis();
    }

    // --- MÉTODOS AUXILIARES ---
    @Transactional
    public PagoModel guardar(PagoModel pago) {
        PedidoModel pedido = pedidoRepository.findById(pago.getPedido().getId())
                .orElseThrow(() -> new RuntimeException("El pedido especificado no existe"));
        pago.setTipoPago(tipoPagoRepository.findById(pago.getTipoPago().getId())
                .orElseThrow(() -> new RuntimeException("Tipo de pago no existe")));
        pago.setTipoComprobante(tipoComprobantePagoRepository.findById(pago.getTipoComprobante().getId())
                .orElseThrow(() -> new RuntimeException("Tipo de comprobante no existe")));

        double total = pedido.getTotalPedido() != null ? pedido.getTotalPedido() : calcularTotalPedido(pedido);
        pago.setMonto(total);

        if (pago.getCodigoTransaccion() == null) {
            pago.setCodigoAutorizacion(String.valueOf(generarCodigo(6)));
            pago.setCodigoTransaccion(String.valueOf(generarCodigo(6)));
            pago.setNumeroSeguimiento("TRX-" + System.currentTimeMillis() + "-" + (100 + random.nextInt(900)));
        }

        PagoModel savedPago = pagoRepository.save(pago);

        boolean esPedidoLocal = pedido.getCliente() != null && pedido.getCliente().getId() == 1;
        boolean esPedidoWeb = !esPedidoLocal;

        if (esPedidoWeb && pago.getTipoPago().getNombreTipoPago().equalsIgnoreCase("Efectivo")) {
            List<DetallePedidoModel> detalles = detallePedidoRepository.findByPedidoId(pedido.getId());
            enviarCorreoConfirmacionEfectivo(pedido, detalles);
        }
        return savedPago;
    }

    private void enviarCorreoConfirmacionEfectivo(PedidoModel pedido, List<DetallePedidoModel> detalles) {
        String nombreCliente = pedido.getCliente().getNombre();
        String correoCliente = pedido.getCliente().getCorreo();
        String asunto = "¡Confirmación de Pedido #" + pedido.getNumeroPedidoCliente() + " - Pendiente de Pago!";
        String cuerpo = "¡Hola " + nombreCliente + "! \n\n" +
                "Hemos recibido tu pedido. **El pago se realizará al momento de la entrega (Efectivo).**\n\n" +
                "Total a Pagar: S/ " + String.format("%.2f", pedido.getTotalPedido()) + "\n\n" +
                "Saludos,\nEl equipo de D'licias Fast Food";
        emailService.enviarCorreo(correoCliente, asunto, cuerpo);
    }

    public String obtenerComprobanteUrl(Integer idPedido, Integer idTipoComprobante, String metodoPago) {
        PedidoModel pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        List<DetallePedidoModel> detalles = detallePedidoRepository.findByPedidoId(idPedido);
        return facturaService.generarYRetornarUrl(pedido, detalles, idTipoComprobante, metodoPago);
    }

    public List<PagoModel> listar() {
        return pagoRepository.findAll();
    }

    private double calcularTotalPedido(PedidoModel pedido) {
        double total = 0;
        List<DetallePedidoModel> detalles = pedido.getDetalles();
        if (detalles == null || detalles.isEmpty()) {
            detalles = detallePedidoRepository.findByPedidoId(pedido.getId());
        }
        if (detalles != null) {
            for (DetallePedidoModel d : detalles)
                total += d.getSubtotal().doubleValue();
        }
        return total;
    }

    private int generarCodigo(int longitud) {
        int min = (int) Math.pow(10, longitud - 1);
        int max = (int) Math.pow(10, longitud) - 1;
        return random.nextInt(max - min + 1) + min;
    }

    public List<PagoModel> listarPorPedido(Integer idPedido) {
        return pagoRepository.findByPedido_Id(idPedido);
    }

    public List<PagoModel> listarPorCliente(Integer idCliente) {
        return pagoRepository.findByPedido_Cliente_Id(idCliente);
    }
}