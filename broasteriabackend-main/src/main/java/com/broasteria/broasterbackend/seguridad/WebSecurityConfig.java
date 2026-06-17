package com.broasteria.broasterbackend.seguridad;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.broasteria.broasterbackend.repositories.EmpleadoRepository;
import com.broasteria.broasterbackend.repositories.EstadoEmpleadoRepository;

import java.util.List;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

        private final UserDetailsServiceImpl userDetailsService;
        private final JWTAuthorizationFilter jwtAuthorizationFilter;
        private final AuthenticationConfiguration authenticationConfiguration;

        @Autowired
        private EmpleadoRepository empleadoRepository;

        @Autowired
        private EstadoEmpleadoRepository estadoEmpleadoRepository;

        public WebSecurityConfig(
                        UserDetailsServiceImpl userDetailsService,
                        JWTAuthorizationFilter jwtAuthorizationFilter,
                        AuthenticationConfiguration authenticationConfiguration) {
                this.userDetailsService = userDetailsService;
                this.jwtAuthorizationFilter = jwtAuthorizationFilter;
                this.authenticationConfiguration = authenticationConfiguration;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

                AuthenticationManager authManager = authenticationManager();

                JWTAuthenticationFilter jwtAuthenticationFilter = new JWTAuthenticationFilter(
                                authManager,
                                empleadoRepository,
                                estadoEmpleadoRepository);

                jwtAuthenticationFilter.setFilterProcessesUrl("/empleados/login");

                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/clientes/crear",
                                                                "/clientes/login",
                                                                "/clientes/**",
                                                                "/clientes/existe/**",
                                                                "/clientes/documento/existe/**",
                                                                "/clientes/recuperar-contrasena",
                                                                "/api/auth/recuperar-contrasena",
                                                                "/api/auth/validar-codigo",
                                                                "/clientes/cambiar-contrasena-perfil",
                                                                "/api/auth/cambiar-contrasena")

                                                .permitAll()

                                                .requestMatchers("/ws/**").permitAll()

                                                .requestMatchers("/chat/**").permitAll()

                                                .requestMatchers(
                                                                "/estadoempleado",
                                                                "/roles",
                                                                "/empleados/validar-admin",
                                                                "/empleados/por-usuario/**")
                                                .permitAll()

                                                .requestMatchers(
                                                                "/empleados/crear",
                                                                "/empleados/actualizarempleado/**",
                                                                "/empleados/eliminarempleado/**",
                                                                "/empleados/logout/**",
                                                                "/empleados/**",
                                                                "/empleados/existe/**")
                                                .authenticated()

                                                .requestMatchers(
                                                                // === PEDIDOS CLIENTE ===
                                                                "/pedidos/crear",
                                                                "/pedidos/**",
                                                                "/pedidos/historial/**",
                                                                "/pedidos/abandonar/**",
                                                                "/pedidos/ListPedidos",
                                                                "/pedidos/**",
                                                                "/pedidos",

                                                                // === GERENTE ===
                                                                "/pedidos/Completado",
                                                                "/pedidos/VentaPorProduc",
                                                                "/pedidos/ProMV",
                                                                "/pedidos/ProMenV",
                                                                "/pedidos/CompVentasMensuales",
                                                                "/pedidos/finalizar/**",
                                                                "/pedidos/cancelar/**",
                                                                "/pedidos/mesAnio/",

                                                                // === PAGOS ===
                                                                "/pagos/crear",
                                                                "/pagos/imprimir/**",
                                                                "/pagos/porCliente/**",
                                                                "/pagos/**",
                                                                "/pagos/niubiz/**",

                                                                // === PRODUCTOS ===
                                                                "/productos",
                                                                "/productos/**",
                                                                "/categorias/listarCategoria",

                                                                // === TIPOS DE PAGO Y COMPROBANTE ===
                                                                "/tipos/pagos",
                                                                "/tipos/comprobantes",

                                                                "/pdfs/**")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .addFilter(jwtAuthenticationFilter)
                                .addFilterBefore(jwtAuthorizationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(List.of(
                        "http://localhost:4200",
                        "https://*.vercel.app"
                ));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Origin", "Accept"));
                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager() throws Exception {
                return authenticationConfiguration.getAuthenticationManager();
        }
}
