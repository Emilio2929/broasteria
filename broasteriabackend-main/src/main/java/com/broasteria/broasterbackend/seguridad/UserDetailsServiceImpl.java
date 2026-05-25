package com.broasteria.broasterbackend.seguridad;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.broasteria.broasterbackend.models.ClienteModel;
import com.broasteria.broasterbackend.models.EmpleadoModel;
import com.broasteria.broasterbackend.repositories.ClienteRepository;
import com.broasteria.broasterbackend.repositories.EmpleadoRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final EmpleadoRepository empleadoRepository;
    private final ClienteRepository clienteRepository;

    public UserDetailsServiceImpl(EmpleadoRepository empleadoRepository, ClienteRepository clienteRepository) {
        this.empleadoRepository = empleadoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        EmpleadoModel empleado = empleadoRepository.findByUsuarioLogin(username).orElse(null);

        if (empleado != null) {
            return new UserDetailsImpl(empleado);
        }

        // Si no es empleado, intentar buscar como CLIENTE
        // Nota: Asumo que en tu base de datos el "username" del cliente es su correo
        ClienteModel cliente = clienteRepository.findByCorreo(username).orElse(null);

        if (cliente != null) {
            return new UserDetailsImpl(cliente);
        }

        // Si no es ninguno, lanzar error
        throw new UsernameNotFoundException("Usuario (Empleado o Cliente) no encontrado con: " + username);
    }
}