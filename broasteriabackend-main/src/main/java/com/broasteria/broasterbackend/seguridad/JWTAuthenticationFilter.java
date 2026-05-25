package com.broasteria.broasterbackend.seguridad;

import java.io.IOException;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.broasteria.broasterbackend.models.EmpleadoModel;
import com.broasteria.broasterbackend.models.EstadoEmpleado;
import com.broasteria.broasterbackend.repositories.EmpleadoRepository;
import com.broasteria.broasterbackend.repositories.EstadoEmpleadoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JWTAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final EmpleadoRepository empleadoRepository;
    private final EstadoEmpleadoRepository estadoEmpleadoRepository;

    public JWTAuthenticationFilter(
            AuthenticationManager authenticationManager,
            EmpleadoRepository empleadoRepository,
            EstadoEmpleadoRepository estadoEmpleadoRepository) {
        this.authenticationManager = authenticationManager;
        this.empleadoRepository = empleadoRepository;
        this.estadoEmpleadoRepository = estadoEmpleadoRepository;
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {

        AuthCredentials authCredentials;
        try {
            authCredentials = new ObjectMapper().readValue(request.getReader(), AuthCredentials.class);
        } catch (IOException e) {
            throw new RuntimeException("Error leyendo credenciales", e);
        }

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                authCredentials.getUsuarioLogin(),
                authCredentials.getContrasenaHash());

        return authenticationManager.authenticate(authToken);
    }

    @Override
    protected void successfulAuthentication(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain,
            Authentication authResult) throws IOException, ServletException {

        UserDetailsImpl user = (UserDetailsImpl) authResult.getPrincipal();

        EmpleadoModel empleado = empleadoRepository.findById(user.getIdEmpleado())
                .orElseThrow();

        EstadoEmpleado estadoActivo = new EstadoEmpleado();
        estadoActivo.setIdEstadoEmpleado(1); // 1 = Activo
        empleado.setEstado(estadoActivo);

        empleadoRepository.save(empleado);

        String token = TokenUtils.generarToken(
                user.getNombre(),
                user.getUsername(),
                user.getRol(),
                user.getIdEmpleado());

        String json = String.format(
                "{\"token\":\"%s\", \"rol\":\"%s\", \"usuarioLogin\":\"%s\", \"idEmpleado\": %d}",
                token,
                user.getRol(),
                user.getUsername(),
                user.getIdEmpleado());

        response.setContentType("application/json");
        response.getWriter().write(json);
        response.getWriter().flush();
    }
}