package com.broasteria.broasterbackend.services;

import com.broasteria.broasterbackend.models.ClienteModel;
import com.broasteria.broasterbackend.models.DetallePedidoModel;
import com.broasteria.broasterbackend.models.PedidoModel;
import com.broasteria.broasterbackend.models.SerieContador;
import com.broasteria.broasterbackend.repositories.SerieContadorRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FacturaService {

    @Value("${nubefact.api.url}")
    private String NUBEFACT_API_BASE_URL;

    @Value("${nubefact.api.ruc}")
    private String NUBEFACT_API_RUC;

    @Value("${nubefact.api.token.header}")
    private String NUBEFACT_API_TOKEN_HEADER;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SerieContadorRepository serieContadorRepository;

    @Async
    @Transactional
    public void generarComprobante(PedidoModel pedido, List<DetallePedidoModel> detalles, Integer idTipoComprobante,
            String metodoPago) {

        System.out.println("Iniciando generación de comprobante para Pedido ID: " + pedido.getId());
        Integer codigoNubefact;
        String serie;

        if (idTipoComprobante != null && idTipoComprobante.equals(2)) {
            // FACTURA
            codigoNubefact = 1;
            serie = "FFF1";
        } else {
            // BOLETA
            codigoNubefact = 2;
            serie = "BBB1";
        }

        Integer nuevoNumero;
        SerieContador contador = null;

        try {
            contador = serieContadorRepository.findBySerie(serie)
                    .orElseThrow(
                            () -> new RuntimeException("Error: La serie " + serie + " no existe en la base de datos."));
            nuevoNumero = contador.getUltimoNumero() + 1;
        } catch (RuntimeException e) {
            System.err.println("Error FATAL en numeración de comprobante: " + e.getMessage());
            return;
        }

        // Construccion del JSON para NubeFact
        String urlFinal = NUBEFACT_API_BASE_URL + NUBEFACT_API_RUC;
        LocalDate hoy = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        String fechaFormateada = hoy.format(formatter);

        Map<String, Object> jsonBody = new HashMap<>();
        jsonBody.put("operacion", "generar_comprobante");
        jsonBody.put("tipo_de_comprobante", codigoNubefact);
        jsonBody.put("serie", serie);
        jsonBody.put("numero", nuevoNumero);
        jsonBody.put("sunat_transaction", 1);
        jsonBody.put("fecha_de_emision", fechaFormateada);
        jsonBody.put("moneda", 1);

        // Datos del cliente
        ClienteModel cliente = pedido.getCliente();
        Integer sunatTipoDocumento = cliente.getTipoDocumento().getId();
        String numeroDocumento = cliente.getNumeroDocumento().toString();
        String denominacion = cliente.getNombre() + " " + cliente.getApellido();

        if (codigoNubefact.equals(1)) {
            // FACTURA
            sunatTipoDocumento = 6;
            numeroDocumento = "20000000001";
            denominacion = "Cliente Demo S.A.C.";
        } else if (sunatTipoDocumento.equals(2)) {
            sunatTipoDocumento = 1;
        }

        jsonBody.put("cliente_tipo_de_documento", sunatTipoDocumento);
        jsonBody.put("cliente_numero_de_documento", numeroDocumento);
        jsonBody.put("cliente_denominacion", denominacion);
        jsonBody.put("cliente_direccion", cliente.getDireccion());
        jsonBody.put("cliente_email", cliente.getCorreo());

        // Totales
        double totalConIgv = pedido.getTotalPedido();
        double totalSinIgv = totalConIgv / 1.18;
        double totalIgv = totalConIgv - totalSinIgv;

        jsonBody.put("total", Math.round(totalConIgv * 100.0) / 100.0);
        jsonBody.put("total_gravada", Math.round(totalSinIgv * 100.0) / 100.0);
        jsonBody.put("total_igv", Math.round(totalIgv * 100.0) / 100.0);

        // Items
        List<Map<String, Object>> items = new ArrayList<>();
        for (DetallePedidoModel det : detalles) {
            Map<String, Object> item = new HashMap<>();
            double itemTotalConIgv = det.getSubtotal().doubleValue();
            double itemPrecioUnitario = itemTotalConIgv / det.getCantidad();
            double itemValorUnitario = itemPrecioUnitario / 1.18;
            double itemSubtotalSinIgv = itemValorUnitario * det.getCantidad();
            double itemIgv = itemTotalConIgv - itemSubtotalSinIgv;

            item.put("unidad_de_medida", "NIU");
            item.put("codigo", det.getProducto().getId().toString());
            item.put("descripcion", det.getProducto().getNombre());
            item.put("cantidad", det.getCantidad());
            item.put("valor_unitario", Math.round(itemValorUnitario * 10000.0) / 10000.0);
            item.put("precio_unitario", Math.round(itemPrecioUnitario * 10000.0) / 10000.0);
            item.put("subtotal", Math.round(itemSubtotalSinIgv * 100.0) / 100.0);
            item.put("tipo_de_igv", 1);
            item.put("igv", Math.round(itemIgv * 100.0) / 100.0);
            item.put("total", Math.round(itemTotalConIgv * 100.0) / 100.0);
            items.add(item);
        }
        jsonBody.put("items", items);

        // Enviar a NubeFact y enviar correo
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + NUBEFACT_API_TOKEN_HEADER);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(jsonBody, headers);
            String jsonResponse = restTemplate.postForObject(urlFinal, entity, String.class);

            contador.setUltimoNumero(nuevoNumero);
            serieContadorRepository.save(contador);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> responseMap = mapper.readValue(jsonResponse,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                    });
            String pdfUrl = (String) responseMap.get("enlace_del_pdf");

            if (pdfUrl != null && !pdfUrl.isEmpty()) {
                byte[] pdfBytes = restTemplate.getForObject(pdfUrl, byte[].class);
                String asuntoDetalle = "¡Tu pedido #" + pedido.getNumeroPedidoCliente() + " y Comprobante Electrónico!";
                String cuerpoDetalle = construirCuerpoDetalle(pedido, detalles, serie, nuevoNumero, metodoPago);

                emailService.enviarCorreoConAdjunto(
                        pedido.getCliente().getCorreo(),
                        asuntoDetalle,
                        cuerpoDetalle,
                        pdfBytes,
                        "Comprobante_" + serie + "-" + String.format("%06d", nuevoNumero) + ".pdf");
            }

        } catch (Exception e) {
            System.err.println("Error FATAL al generar o enviar comprobante/PDF: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String construirCuerpoDetalle(PedidoModel pedido, List<DetallePedidoModel> detalles, String serie,
            Integer numeroComprobante, String metodoPago) {
        StringBuilder cuerpo = new StringBuilder();

        cuerpo.append("¡Hola ").append(pedido.getCliente().getNombre()).append("!\n\n");
        cuerpo.append("Tu pago ha sido exitoso. Adjunto encontrarás tu comprobante electrónico.\n\n");
        cuerpo.append("========================================\n");
        cuerpo.append("   RESUMEN DE TU PEDIDO\n");
        cuerpo.append("========================================\n\n");
        cuerpo.append("Pedido N°: ").append(pedido.getNumeroPedidoCliente()).append("\n");
        cuerpo.append("Comprobante: ").append(serie).append("-").append(String.format("%06d", numeroComprobante))
                .append("\n");
        if (metodoPago != null && !metodoPago.isEmpty()) {
            cuerpo.append("Método de Pago: ").append(metodoPago).append("\n");
        }
        cuerpo.append("Estado del pedido: **")
                .append(pedido.getEstado().getNombre().toUpperCase())
                .append("**\n\n");
        cuerpo.append("Detalle:\n");
        for (DetallePedidoModel det : detalles) {
            cuerpo.append("  - ")
                    .append(det.getProducto().getNombre())
                    .append(" (x")
                    .append(det.getCantidad())
                    .append(") ... S/ ")
                    .append(String.format("%.2f", det.getSubtotal()))
                    .append("\n");
        }
        cuerpo.append("\nTotal Pagado: S/ ").append(String.format("%.2f", pedido.getTotalPedido())).append("\n\n");
        cuerpo.append("Saludos,\n");
        cuerpo.append("El equipo de D'licias Fast Food");

        return cuerpo.toString();
    }

    public String generarYRetornarUrl(PedidoModel pedido, List<DetallePedidoModel> detalles, Integer idTipoComprobante,
            String metodoPago) {
        try {
            // === Determinar tipo de comprobante y serie ===
            Integer codigoNubefact = (idTipoComprobante != null && idTipoComprobante.equals(2)) ? 1 : 2; // 1=Factura,
                                                                                                         // 2=Boleta
            String serie = (idTipoComprobante != null && idTipoComprobante.equals(2)) ? "FFF1" : "BBB1";

            // === Obtener y actualizar numeración desde la base de datos ===
            SerieContador contador = serieContadorRepository.findBySerie(serie)
                    .orElseThrow(() -> new RuntimeException("Serie no encontrada: " + serie));
            Integer nuevoNumero = contador.getUltimoNumero() + 1;
            contador.setUltimoNumero(nuevoNumero);
            serieContadorRepository.save(contador);

            // === Construcción del JSON para NubeFact ===
            Map<String, Object> jsonBody = new HashMap<>();
            jsonBody.put("operacion", "generar_comprobante");
            jsonBody.put("tipo_de_comprobante", codigoNubefact);
            jsonBody.put("serie", serie);
            jsonBody.put("numero", nuevoNumero);
            jsonBody.put("sunat_transaction", 1);
            jsonBody.put("fecha_de_emision", LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            jsonBody.put("moneda", 1);

            // === Datos del cliente ===
            ClienteModel cliente = pedido.getCliente();
            Integer tipoDoc = (cliente.getTipoDocumento() != null) ? cliente.getTipoDocumento().getId() : 1;
            String numDoc = (cliente.getNumeroDocumento() != null && !cliente.getNumeroDocumento().isEmpty())
                    ? cliente.getNumeroDocumento()
                    : "00000000";
            jsonBody.put("cliente_tipo_de_documento", tipoDoc);
            jsonBody.put("cliente_numero_de_documento", numDoc);
            jsonBody.put("cliente_denominacion", cliente.getNombre() + " " + cliente.getApellido());
            jsonBody.put("cliente_direccion", cliente.getDireccion());
            jsonBody.put("cliente_email", cliente.getCorreo());

            // si es FACTURA, forzar RUC demo válido
            if (codigoNubefact == 1) {
                jsonBody.put("cliente_tipo_de_documento", 6);
                jsonBody.put("cliente_numero_de_documento", "20000000001");
                jsonBody.put("cliente_denominacion", "Cliente Demo S.A.C.");
            }

            // === Totales ===
            double totalConIgv = pedido.getTotalPedido();
            double totalSinIgv = totalConIgv / 1.18;
            double totalIgv = totalConIgv - totalSinIgv;

            jsonBody.put("total", Math.round(totalConIgv * 100.0) / 100.0);
            jsonBody.put("total_gravada", Math.round(totalSinIgv * 100.0) / 100.0);
            jsonBody.put("total_igv", Math.round(totalIgv * 100.0) / 100.0);

            // === Detalle de ítems ===
            List<Map<String, Object>> items = new ArrayList<>();
            for (DetallePedidoModel det : detalles) {
                Map<String, Object> item = new HashMap<>();
                double itemTotal = det.getSubtotal().doubleValue();
                double valorUnitario = (itemTotal / det.getCantidad()) / 1.18;
                double subtotal = valorUnitario * det.getCantidad();
                double igv = itemTotal - subtotal;

                item.put("unidad_de_medida", "NIU");
                item.put("codigo", det.getProducto().getId().toString());
                item.put("descripcion", det.getProducto().getNombre());
                item.put("cantidad", det.getCantidad());
                item.put("valor_unitario", Math.round(valorUnitario * 10000.0) / 10000.0);
                item.put("precio_unitario", Math.round(valorUnitario * 1.18 * 10000.0) / 10000.0);
                item.put("subtotal", Math.round(subtotal * 100.0) / 100.0);
                item.put("tipo_de_igv", 1);
                item.put("igv", Math.round(igv * 100.0) / 100.0);
                item.put("total", Math.round(itemTotal * 100.0) / 100.0);
                items.add(item);
            }
            jsonBody.put("items", items);

            // === Envío a Nubefact ===
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + NUBEFACT_API_TOKEN_HEADER);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(jsonBody, headers);
            String jsonResponse = restTemplate.postForObject(NUBEFACT_API_BASE_URL + NUBEFACT_API_RUC, entity,
                    String.class);

            // === Procesar respuesta ===
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> responseMap = mapper.readValue(jsonResponse,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                    });
            String pdfUrl = (String) responseMap.get("enlace_del_pdf");

            if (pdfUrl == null || pdfUrl.isEmpty()) {
                System.err.println("Nubefact no devolvió un enlace de PDF. Detalle: " + responseMap);
                return null;
            }

            System.out.println("PDF generado correctamente: " + pdfUrl);
            return pdfUrl;

        } catch (Exception e) {
            System.err.println("Error al generar comprobante: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}