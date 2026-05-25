package com.broasteria.broasterbackend.services;

import com.broasteria.broasterbackend.models.EmpleadoModel;
import com.broasteria.broasterbackend.models.EstadoEmpleado;
import com.broasteria.broasterbackend.repositories.EmpleadoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EmpleadoService {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Listar todos
    public List<EmpleadoModel> listarTodos() {
        return empleadoRepository.findAll();
    }

    // Buscar por ID
    public Optional<EmpleadoModel> buscarPorId(Integer id) {
        return empleadoRepository.findById(id);
    }

    // Guardar o actualizar
    public EmpleadoModel guardar(EmpleadoModel empleado) {
        String pass = empleado.getContrasenaHash();
        if (empleado.getIdEmpleado() == null) {
            empleado.setContrasenaHash(passwordEncoder.encode(pass));
        } else {
            if (!pass.startsWith("$2a$")) {
                empleado.setContrasenaHash(passwordEncoder.encode(pass));
            }
        }
        return empleadoRepository.save(empleado);
    }

    // Actualizar empleado
    public EmpleadoModel actualizarEmpleado(EmpleadoModel emp, Integer id) {
        EmpleadoModel em = empleadoRepository.findById(id).get();
        em.setNombre(emp.getNombre());
        em.setApellido(emp.getApellido());
        em.setRol(emp.getRol());
        em.setUsuarioLogin(emp.getUsuarioLogin());
        if (emp.getContrasenaHash() != null && !emp.getContrasenaHash().isBlank()) {
            if (!emp.getContrasenaHash().startsWith("$2a$")) {
                em.setContrasenaHash(passwordEncoder.encode(emp.getContrasenaHash()));
            } else {
                em.setContrasenaHash(emp.getContrasenaHash());
            }
        }
        return empleadoRepository.save(em);
    }

    // Eliminar un empleado
    public boolean eliminarEmpleado(Integer id) {
        empleadoRepository.deleteById(id);
        return true;
    }

    // Buscar por usuario
    public Optional<EmpleadoModel> buscarPorUsuario(String usuarioLogin) {
        return empleadoRepository.findByUsuarioLogin(usuarioLogin);
    }

    // validar contraseña en gestion empleados
    public boolean validarPassword(EmpleadoModel empleado, String contrasena) {
        return passwordEncoder.matches(contrasena, empleado.getContrasenaHash());
    }

    @Transactional
    public void logoutEmpleado(Integer idEmpleado) {
        Optional<EmpleadoModel> empleadoOpt = empleadoRepository.findById(idEmpleado);
        if (empleadoOpt.isPresent()) {
            EmpleadoModel empleado = empleadoOpt.get();

            EstadoEmpleado estadoInactivo = new EstadoEmpleado();
            estadoInactivo.setIdEstadoEmpleado(2);
            empleado.setEstado(estadoInactivo);

            empleadoRepository.save(empleado);
        }
    }
}