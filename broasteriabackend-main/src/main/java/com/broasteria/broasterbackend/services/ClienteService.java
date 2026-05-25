package com.broasteria.broasterbackend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.broasteria.broasterbackend.models.ClienteModel;
import com.broasteria.broasterbackend.repositories.ClienteRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Listar todos
    public List<ClienteModel> listarTodos() {
        return clienteRepository.findAll();
    }

    // Buscar por ID
    public Optional<ClienteModel> buscarPorId(Integer id) {
        return clienteRepository.findById(id);
    }

    public ClienteModel guardar(ClienteModel cliente) {

        if (cliente.getId() == null) {
            cliente.setContrasena(passwordEncoder.encode(cliente.getContrasena()));
        } else if (!cliente.getContrasena().startsWith("$2a$")) {
            cliente.setContrasena(passwordEncoder.encode(cliente.getContrasena()));
        }
        return clienteRepository.save(cliente);
    }

    // Eliminar
    public void eliminar(Integer id) {
        clienteRepository.deleteById(id);
    }

    public Optional<ClienteModel> buscarPorCorreo(String correo) {
        return clienteRepository.findByCorreo(correo);
    }

    public boolean existeCorreo(String correo) {
        return clienteRepository.existsByCorreo(correo);
    }

    public boolean existeNumeroDocumento(String numeroDocumento) {
        return clienteRepository.existsByNumeroDocumento(numeroDocumento);
    }

    public boolean cambiarContrasenaPerfil(Integer idCliente, String contrasenaActual, String contrasenaNueva) {
        Optional<ClienteModel> clienteOpt = clienteRepository.findById(idCliente);

        if (clienteOpt.isPresent()) {
            ClienteModel cliente = clienteOpt.get();

            if (passwordEncoder.matches(contrasenaActual, cliente.getContrasena())) {

                cliente.setContrasena(passwordEncoder.encode(contrasenaNueva));
                clienteRepository.save(cliente);
                return true;
            }
        }
        return false;
    }
}