package com.broasteria.broasterbackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.broasteria.broasterbackend.models.ClienteModel;
import com.broasteria.broasterbackend.seguridad.TokenUtils;
import com.broasteria.broasterbackend.services.ClienteService;
import com.broasteria.broasterbackend.services.ExternalApiService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ExternalApiService externalApiService;

    @GetMapping("/perfil")
    public ResponseEntity<?> obtenerPerfil() {
        try {

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();

            Optional<ClienteModel> cliente = clienteService.buscarPorCorreo(email);

            if (cliente.isPresent()) {
                return ResponseEntity.ok(cliente.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token inválido o sesión expirada");
        }
    }

    @GetMapping("/validar-documento/{tipo}/{numero}")
    public ResponseEntity<Map<String, Object>> validarDocumento(
            @PathVariable String tipo,
            @PathVariable String numero) {

        // Se llama al servicio seguro
        Map<String, Object> resultado = externalApiService.consultarDocumento(tipo, numero);

        return ResponseEntity.ok(resultado);
    }

    // Listar todos
    @GetMapping
    public List<ClienteModel> listar() {
        return clienteService.listarTodos();
    }

    // Obtener por ID
    @GetMapping("/{id}")
    public Optional<ClienteModel> obtenerPorId(@PathVariable Integer id) {
        return clienteService.buscarPorId(id);
    }

    // Crear nuevo cliente
    @PostMapping("/crear")
    public ClienteModel crear(@RequestBody ClienteModel cliente) {
        return clienteService.guardar(cliente);
    }

    // Actualizar cliente
    @PutMapping("/{id}")
    public ClienteModel actualizar(@PathVariable Integer id, @RequestBody ClienteModel cliente) {
        cliente.setId(id);
        return clienteService.guardar(cliente);
    }

    // Eliminar cliente
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        clienteService.eliminar(id);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginCliente(@RequestBody Map<String, String> datosLogin) {
        String correo = datosLogin.get("correo");
        String contrasena = datosLogin.get("contrasena");

        Optional<ClienteModel> clienteOpt = clienteService.buscarPorCorreo(correo);

        if (clienteOpt.isPresent()) {
            ClienteModel cliente = clienteOpt.get();

            if (passwordEncoder.matches(contrasena, cliente.getContrasena())) {
                // Generamos el Token JWT
                String token = TokenUtils.generarToken(
                        cliente.getNombre(),
                        cliente.getCorreo(),
                        "CLIENTE",
                        cliente.getId());

                // Preparamos la respuesta con el Token y los datos del usuario
                Map<String, Object> respuesta = new HashMap<>();
                respuesta.put("token", token);
                respuesta.put("cliente", cliente);

                return ResponseEntity.ok(respuesta);

            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("mensaje", "Contraseña incorrecta"));
            }
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", "El correo no está registrado"));
        }
    }

    @GetMapping("/existe/{correo}")
    public ResponseEntity<Boolean> existeCorreo(@PathVariable String correo) {
        boolean existe = clienteService.existeCorreo(correo);
        return ResponseEntity.ok(existe);
    }

    @GetMapping("/documento/existe/{numeroDocumento}")
    public ResponseEntity<Boolean> existeDocumento(@PathVariable String numeroDocumento) {
        boolean existe = clienteService.existeNumeroDocumento(numeroDocumento);
        return ResponseEntity.ok(existe);
    }

    @PutMapping("/cambiar-contrasena-perfil")
    public ResponseEntity<?> cambiarContrasenaPerfil(@RequestBody Map<String, String> datos) {
        try {
            Integer id = Integer.parseInt(datos.get("id"));
            String actual = datos.get("contrasenaActual");
            String nueva = datos.get("contrasenaNueva");

            boolean exito = clienteService.cambiarContrasenaPerfil(id, actual, nueva);

            if (exito) {
                return ResponseEntity.ok("Contraseña actualizada correctamente");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("La contraseña actual es incorrecta");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error en la solicitud");
        }
    }
}