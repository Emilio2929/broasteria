package com.broasteria.broasterbackend.services;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
public class ExternalApiService {

    @Value("${decolecta.api.key}")
    private String decolectaApiKey;

    @Value("${decolecta.reniec.url}")
    private String reniecUrl;

    @Value("${decolecta.sunat.ruc.url}")
    private String sunatRucUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> consultarDocumento(String tipo, String numeroDocumento) {
        String urlBase = tipo.equals("DNI") ? this.reniecUrl : tipo.equals("RUC") ? this.sunatRucUrl : null;

        if (urlBase == null) {
            return Map.of("valido", false, "mensaje", "Tipo de documento no soportado.");
        }

        String urlCompleta = urlBase + numeroDocumento;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", "Bearer " + this.decolectaApiKey);

        try {

            ResponseEntity<Map> response = restTemplate.exchange(urlCompleta, HttpMethod.GET, new HttpEntity<>(headers),
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return Map.of("valido", true, "data", response.getBody());
            }

        } catch (HttpClientErrorException e) {

            String mensaje = (e.getStatusCode() == HttpStatus.NOT_FOUND) ? tipo + " no existe."
                    : "Documento inválido o error en la consulta.";

            return Map.of("valido", false, "mensaje", mensaje);

        } catch (Exception e) {
            return Map.of("valido", false, "mensaje", "Error al comunicarse con la API de Decolecta.");
        }

        return Map.of("valido", false, "mensaje", "Respuesta inesperada.");
    }
}
