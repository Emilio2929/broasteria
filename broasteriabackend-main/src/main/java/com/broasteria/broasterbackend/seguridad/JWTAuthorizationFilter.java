package com.broasteria.broasterbackend.seguridad;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JWTAuthorizationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.replace("Bearer ", "").trim();

            try {
                UsernamePasswordAuthenticationToken upat = TokenUtils.validarToken(token);

                if (upat != null) {
                    SecurityContextHolder.getContext().setAuthentication(upat);
                } else {
                    System.out.println("TokenUtils devolvió NULL (Token inválido, expirado o firma incorrecta)");
                }
            } catch (Exception e) {
                System.out.println("Error validando token: " + e.getMessage());
            }
        } else {
        }

        filterChain.doFilter(request, response);
    }
}