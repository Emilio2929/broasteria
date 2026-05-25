package com.broasteria.broasterbackend.controllers;

import com.broasteria.broasterbackend.models.EmpleadoModel;
import com.broasteria.broasterbackend.models.EstadoEmpleado;
import com.broasteria.broasterbackend.services.EmpleadoService;
import com.broasteria.broasterbackend.repositories.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/empleados")
public class EmpleadoController {

    @Autowired
    private EmpleadoService empleadoService;
    @Autowired
    private EmpleadoRepository empleadoRepository;

    // Listar todos
    @GetMapping
    public List<EmpleadoModel> listar() {
        return empleadoService.listarTodos();
    }

    // Buscar por ID
    @GetMapping("/{id}")
    public Optional<EmpleadoModel> obtenerPorId(@PathVariable Integer id) {
        return empleadoService.buscarPorId(id);
    }

    // Crear nuevo empleado
    @PostMapping("/crear")
    public EmpleadoModel crear(@RequestBody EmpleadoModel empleado) {
        EstadoEmpleado estadoActivo = new EstadoEmpleado();
        estadoActivo.setIdEstadoEmpleado(2);
        empleado.setEstado(estadoActivo);
        return empleadoService.guardar(empleado);
    }

    // Actualizar Empleado
    @PutMapping(path = "/actualizarempleado/{id}")
    public EmpleadoModel actualizar(@PathVariable Integer id, @RequestBody EmpleadoModel entity) {
        return empleadoService.actualizarEmpleado(entity, id);
    }

    // Eliminar empleado
    @DeleteMapping(path = "/eliminarempleado/{id}")
    public String eliminarEmpleado(@PathVariable("id") Integer id) {
        empleadoService.eliminarEmpleado(id);
        return "success";
    }

    @GetMapping("/por-usuario/{usuarioLogin}")
    public ResponseEntity<EmpleadoModel> obtenerPorUsuario(@PathVariable String usuarioLogin) {
        return empleadoRepository.findByUsuarioLogin(usuarioLogin)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // LOGOUT
    @PostMapping("/logout/{id}")
    public ResponseEntity<String> logoutEmpleado(@PathVariable Integer id) {
        empleadoService.logoutEmpleado(id);
        return ResponseEntity.ok("Empleado desconectado correctamente");
    }

    // validar contraseña en gestion empleados
    @PostMapping("/validar-admin")
    public ResponseEntity<Boolean> validarAdmin(@RequestBody Map<String, String> datos) {

        String usuario = datos.get("usuarioLogin");
        String contrasena = datos.get("contrasena");

        Optional<EmpleadoModel> empleadoOpt = empleadoService.buscarPorUsuario(usuario);

        if (empleadoOpt.isEmpty()) {
            return ResponseEntity.status(404).body(false);
        }

        EmpleadoModel empleado = empleadoOpt.get();

        if (!empleado.getRol().getNombreRol().equalsIgnoreCase("Administrador")) {
            return ResponseEntity.status(403).body(false);
        }
        boolean ok = empleadoService.validarPassword(empleado, contrasena);
        return ResponseEntity.ok(ok);
    }
}
