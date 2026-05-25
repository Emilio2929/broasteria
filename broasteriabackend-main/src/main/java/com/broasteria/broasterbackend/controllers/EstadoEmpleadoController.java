package com.broasteria.broasterbackend.controllers;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.broasteria.broasterbackend.models.EstadoEmpleado;
import com.broasteria.broasterbackend.services.EstadoEmpleadoService;

@RestController
@RequestMapping("/estadoempleado")
public class EstadoEmpleadoController {

    @Autowired
    EstadoEmpleadoService estadoEmpleadoService;

    // Listar Estados del Empleado
    @GetMapping
    public ArrayList<EstadoEmpleado> ListarEstadodeEmpleados() {
        return estadoEmpleadoService.obtenerListadeEstadodelEmpleado();
    }
}
