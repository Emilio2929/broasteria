package com.broasteria.broasterbackend.seguridad;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

public class TokenUtils {

    private final static String ACCESS_TOKEN_SECRET = "4qhq8LrEBfYcaRHxhdb9zURb2rf8e7Ud";
    private final static Long ACCESS_TOKEN_VALIDITY_SECONDS = 86_400L;

    public static String generarToken(String nombre, String usuarioLogin, String rol, Integer idEmpleado) {
        long expirationTime = ACCESS_TOKEN_VALIDITY_SECONDS * 1000;
        Date expirationDate = new Date(System.currentTimeMillis() + expirationTime);

        Map<String, Object> extra = new HashMap<>();
        extra.put("nombre", nombre);
        extra.put("rol", rol);
        extra.put("idEmpleado", idEmpleado);

        return Jwts.builder()
                .setSubject(usuarioLogin)
                .setExpiration(expirationDate)
                .addClaims(extra)
                .signWith(Keys.hmacShaKeyFor(ACCESS_TOKEN_SECRET.getBytes()))
                .compact();
    }

    public static UsernamePasswordAuthenticationToken validarToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(ACCESS_TOKEN_SECRET.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String usuarioLogin = claims.getSubject();
            String rol = (String) claims.get("rol");

            if (rol != null) {
                return new UsernamePasswordAuthenticationToken(
                        usuarioLogin,
                        null,
                        List.of(new SimpleGrantedAuthority(rol)));
            } else {
                return new UsernamePasswordAuthenticationToken(usuarioLogin, null, Collections.emptyList());
            }
        } catch (Exception ex) {
            return null;
        }
    }
}