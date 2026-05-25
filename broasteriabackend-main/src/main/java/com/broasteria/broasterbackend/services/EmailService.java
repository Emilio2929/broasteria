package com.broasteria.broasterbackend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

import org.springframework.scheduling.annotation.Async;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    // Metodo para enviar correos simples
    public void enviarCorreo(String destinatario, String asunto, String cuerpo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);

        mailSender.send(mensaje);
        System.out.println("Correo enviado exitosamente a: " + destinatario);
    }

    @Async
    public void enviarCorreoConAdjunto(String destinatario, String asunto, String cuerpo, byte[] archivoAdjunto,
            String nombreArchivo) {
        try {
            MimeMessage mensajeMime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensajeMime, true, "UTF-8");

            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setText(cuerpo);

            // Adjuntar el archivo
            helper.addAttachment(nombreArchivo, new ByteArrayResource(archivoAdjunto));

            mailSender.send(mensajeMime);
            System.out.println("Correo con adjunto (" + nombreArchivo + ") enviado a: " + destinatario);
        } catch (Exception e) {
            System.err.println("Error al enviar correo con adjunto: " + e.getMessage());
            e.printStackTrace();
        }
    }

}