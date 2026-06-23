package com.broasteria.broasterbackend.controllers;

import com.broasteria.broasterbackend.services.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private OtpService otpService;

    @PostMapping("/recuperar-contrasena")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String correo = request.get("correo");

        try {
            boolean enviado = otpService.generarYEnviarOtp(correo);

            if (enviado) {
                return ResponseEntity.ok().body(Map.of("mensaje", "Código de recuperación enviado a tu correo."));
            }

            return ResponseEntity.badRequest().body(Map.of("mensaje", "El correo no está registrado."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("mensaje", "No se pudo enviar el correo. Verifica la configuración del servidor."));
        }
    }

    @PostMapping("/validar-codigo")
    public ResponseEntity<?> validateOtp(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        boolean valido = otpService.validarOtp(token);

        if (valido) {
            return ResponseEntity.ok()
                    .body(Map.of("mensaje", "Código válido. Puede proceder a cambiar la contraseña."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Código inválido o expirado."));
        }
    }

    @PostMapping("/cambiar-contrasena")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String nuevaContrasena = request.get("nuevaContrasena");

        boolean cambiado = otpService.restablecerContrasena(token, nuevaContrasena);

        if (cambiado) {
            return ResponseEntity.ok().body(Map.of("mensaje", "Contraseña actualizada exitosamente."));
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "No se pudo actualizar la contraseña. El token puede ser inválido."));
        }
    }
}
