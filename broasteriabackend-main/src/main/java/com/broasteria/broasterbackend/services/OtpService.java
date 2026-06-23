package com.broasteria.broasterbackend.services;

import com.broasteria.broasterbackend.models.ClienteModel;
import com.broasteria.broasterbackend.models.OtpToken;
import com.broasteria.broasterbackend.repositories.ClienteRepository;
import com.broasteria.broasterbackend.repositories.OtpTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public boolean generarYEnviarOtp(String correoCliente) {
        Optional<ClienteModel> clienteOpt = clienteRepository.findByCorreo(correoCliente);

        if (clienteOpt.isEmpty()) {
            return false;
        }
        ClienteModel cliente = clienteOpt.get();

        String token = String.format("%06d", new Random().nextInt(999999));
        try {
            String asunto = "Recuperación de Contraseña - Broastería";
            String mensaje = "Hola " + cliente.getNombre() + ",\n\n" +
                    "Tu código de recuperación es: " + token + "\n" +
                    "Este código expira en 15 minutos.\n\n" +
                    "Si no solicitaste esto, ignora este mensaje.";

            emailService.enviarCorreo(cliente.getCorreo(), asunto, mensaje);
            OtpToken otpToken = new OtpToken(token, cliente, 15);
            otpTokenRepository.save(otpToken);

            return true;
        } catch (Exception e) {
            System.err.println(" Error al enviar el correo de recuperación de contraseña: " + e.getMessage());
            throw new IllegalStateException("No se pudo enviar el correo de recuperación.", e);
        }
    }

    public boolean validarOtp(String tokenIngresado) {
        Optional<OtpToken> otpOpt = otpTokenRepository.findByToken(tokenIngresado);

        if (otpOpt.isPresent()) {
            OtpToken otp = otpOpt.get();
            if (otp.esValido()) {

                return true;
            }
        }
        return false;
    }

    public boolean restablecerContrasena(String token, String nuevaContrasena) {
        Optional<OtpToken> otpOpt = otpTokenRepository.findByToken(token);

        if (otpOpt.isPresent()) {
            OtpToken otp = otpOpt.get();
            if (otp.esValido()) {
                ClienteModel cliente = otp.getCliente();

                String contrasenaEncriptada = passwordEncoder.encode(nuevaContrasena);

                cliente.setContrasena(contrasenaEncriptada);

                clienteRepository.save(cliente);

                otp.setUsado(true);
                otpTokenRepository.save(otp);

                return true;
            }
        }
        return false;
    }
}
