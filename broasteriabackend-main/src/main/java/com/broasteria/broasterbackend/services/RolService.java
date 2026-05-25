package com.broasteria.broasterbackend.services;

import java.util.ArrayList;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.broasteria.broasterbackend.models.RolModel;
import com.broasteria.broasterbackend.repositories.RolRepository;

@Service
public class RolService {

    @Autowired
    RolRepository rolRepository;

    // Lista de roles
    public ArrayList<RolModel> obtenerListadeRoles() {
        return (ArrayList<RolModel>) rolRepository.findAll();
    }

    // Crear un rol
    public RolModel crearRol(RolModel rol) {
        return rolRepository.save(rol);
    }

    // Eliminar un rol
    public boolean eliminarRol(Integer id) {
        rolRepository.deleteById(id);
        return true;
    }

    // Actualizar rol
    public RolModel actualizarRol(RolModel rol, Integer id) {
        RolModel rol2 = rolRepository.findById(id).get();
        rol2.setNombreRol(rol.getNombreRol());
        rolRepository.save(rol2);
        return rol2;
    }

    // Listar rol por ID
    public Optional<RolModel> obtenerRolporID(Integer id) {
        return rolRepository.findById(id);

    }
}