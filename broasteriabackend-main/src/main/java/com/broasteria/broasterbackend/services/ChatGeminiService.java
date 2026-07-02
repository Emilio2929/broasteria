package com.broasteria.broasterbackend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.broasteria.broasterbackend.models.ProductoModel;
import com.broasteria.broasterbackend.models.PedidoModel;
import com.broasteria.broasterbackend.repositories.PedidoRepository;
import com.broasteria.broasterbackend.repositories.ProductoRepository;

import org.springframework.http.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatGeminiService {

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private PedidoRepository pedidoRepository;

    public String obtenerRespuestaIA(String mensajeUsuario, Integer idCliente) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            if (apiKey == null || apiKey.isEmpty()) {
                return "Error: Falta la API Key.";
            }

            // OBTENER DATOS DE LA BD
            String menuActualizado = generarTextoDelMenu();

            // BUSCAMOS INFORMACIÓN DEL PEDIDO
            String infoPedidos = buscarInformacionDePedido(mensajeUsuario, idCliente);

            // PROMPT SISTEMA
            String promptSistema = """
                    Actúa como PolloBot, el asistente virtual experto y amable de la pollería D'licias Fast Food

                    INFORMACION DEL NEGOCIO:
                    - Dirección: Calle Paula Quiroz 299 Sta. Luzmila - Comas
                    - Horario: Lunes a Domingo de 6:00 PM a 12:00 AM.
                    - Teléfono/WhatsApp: 987654321

                    MÉTODOS DE PAGO ACEPTADOS:
                    - Efectivo (contraentrega)
                    - Yape
                    - Tarjetas Visa/Mastercard (Niubiz Web)

                    TU OBJETIVO:
                    Responder dudas sobre la carta, precios y estado de pedidos basándote EXCLUSIVAMENTE en la siguiente información

                    LISTA DE PRECIOS OFICIAL:
                    """
                    + menuActualizado + """

                            === ESTADO DE MIS PEDIDOS ===
                            """ + infoPedidos + """

                            REGLAS:
                            1. Si el usuario pregunta por un precio, busca en la lista de arriba y dalo exacto
                            2. Si el producto no está en la lista, di amablemente que no lo vendemos
                            3. Si en 'ESTADO DE MIS PEDIDOS' hay información, dísela al cliente amablemente
                            4. Respuestas cortas, peruanas y amables. Usa emojis
                            5. Cuando menciones opciones o productos, muéstralos SIEMPRE en forma de lista, con un elemento por línea.
                            6. Intenta cerrar la venta animando a pedir
                            """;

            // ARMAMOS EL JSON para Groq (formato OpenAI)
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama3-8b-8192");
            requestBody.put("max_tokens", 300); // Límite para evitar errores de cuota (Error 429)
            requestBody.put("temperature", 0.7);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", promptSistema),
                    Map.of("role", "user", "content", mensajeUsuario)));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // ENVIAMOS A GROQ
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);

            if (response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return message.get("content").toString();
                }
            }
            return "No entendí muy bien, ¿puedes repetirlo?";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getClass().getSimpleName() + " - " + e.getMessage();
        }
    }

    private String generarTextoDelMenu() {
        List<ProductoModel> productos = productoRepository.findAll();
        if (productos.isEmpty()) {
            return "No hay productos disponibles por ahora.";
        }
        return productos.stream()
                .map(p -> "- " + p.getNombre() + ": S/ " + p.getPrecio())
                .collect(Collectors.joining("\n"));
    }

    private String buscarInformacionDePedido(String mensaje, Integer idCliente) {

        Pattern pattern = Pattern.compile("(?:pedido|orden|nro|numero)\\s*(?:de)?\\s*#?(\\d+)",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(mensaje);

        if (matcher.find()) {
            String numeroDetectado = matcher.group(1);
            try {
                Integer idPedido = Integer.parseInt(numeroDetectado);
                Optional<PedidoModel> pedidoOpt = pedidoRepository.findById(idPedido);

                if (pedidoOpt.isPresent()) {
                    PedidoModel pedido = pedidoOpt.get();

                    if (idCliente != null && !pedido.getCliente().getId().equals(idCliente)) {
                        return ">>> AVISO: El cliente preguntó por el pedido #" + idPedido
                                + " pero pertenece a otra persona. No dar info.";
                    }

                    String estado = pedido.getEstado().getNombre();
                    return ">>> ENCONTRADO: El Pedido #" + idPedido + " está actualmente: " + estado;
                } else {
                    return ">>> INFO: El pedido #" + idPedido + " NO existe en la base de datos.";
                }
            } catch (Exception e) {
                return "";
            }
        }

        if (idCliente != null) {
            List<PedidoModel> pedidos = pedidoRepository.findByClienteIdOrderByFechaPedidoDesc(idCliente);

            if (!pedidos.isEmpty()) {
                PedidoModel ultimo = pedidos.get(0);
                return ">>> AUTOMÁTICO: El cliente no dijo número, pero su ÚLTIMO pedido es el #"
                        + ultimo.getNumeroPedidoCliente() +
                        " y su estado es: " + ultimo.getEstado().getNombre();
            } else {
                return ">>> INFO: Este cliente está registrado pero aún no tiene pedidos.";
            }
        }

        return "El cliente no mencionó número y no ha iniciado sesión.";
    }
}