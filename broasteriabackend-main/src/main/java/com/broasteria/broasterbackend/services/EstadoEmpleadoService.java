package com.broasteria.broasterbackend.services;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.broasteria.broasterbackend.models.EstadoEmpleado;
import com.broasteria.broasterbackend.repositories.EstadoEmpleadoRepository;

@Service
public class EstadoEmpleadoService {

    @Autowired
    EstadoEmpleadoRepository estadoEmpleadoRepository;

    // Lista de estado de empleado
    public ArrayList<EstadoEmpleado> obtenerListadeEstadodelEmpleado() {
        return (ArrayList<EstadoEmpleado>) estadoEmpleadoRepository.findAll();
    }
}
