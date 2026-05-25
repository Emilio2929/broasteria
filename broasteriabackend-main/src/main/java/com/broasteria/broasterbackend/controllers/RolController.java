package com.broasteria.broasterbackend.controllers;

import java.util.ArrayList;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.broasteria.broasterbackend.models.RolModel;
import com.broasteria.broasterbackend.services.RolService;

@RestController
@RequestMapping("/roles")
public class RolController {

    @Autowired
    RolService rolService;

    // Listar Roles
    @GetMapping
    public ArrayList<RolModel> ListarRoles() {
        return rolService.obtenerListadeRoles();
    }

    // Crear un rol
    @PostMapping(path = "/crearrol")
    public RolModel crearRol(@RequestBody RolModel entity) {
        return rolService.crearRol(entity);
    }

    // Listar Roles por su ID
    @GetMapping(path = "/codigorol/{id}")
    public Optional<RolModel> ObtenerporId(@PathVariable("id") Integer id) {
        return rolService.obtenerRolporID(id);
    }

    // Eliminar Rol
    @DeleteMapping(path = "/eliminarrol/{id}")
    public String eliminarRol(@PathVariable("id") Integer id) {
        rolService.eliminarRol(id);
        return "success";
    }

    // Actualizar Empleado
    @PutMapping(path = "/actualizarrol/{id}")
    public RolModel actualizar(@PathVariable Integer id, @RequestBody RolModel entity) {
        return rolService.actualizarRol(entity, id);
    }
}
