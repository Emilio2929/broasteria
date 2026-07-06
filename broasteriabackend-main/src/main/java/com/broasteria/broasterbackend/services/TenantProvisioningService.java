package com.broasteria.broasterbackend.services;

import com.broasteria.broasterbackend.config.TenantRoutingDataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.datasource.init.DatabasePopulatorUtils;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

@Service
public class TenantProvisioningService {

    @Autowired
    private TenantRoutingDataSource tenantRoutingDataSource;

    @Autowired
    private ResourceLoader resourceLoader;

    @Value("${spring.datasource.url}")
    private String masterUrl;

    @Value("${spring.datasource.username}")
    private String masterUsername;

    @Value("${spring.datasource.password}")
    private String masterPassword;

    public synchronized void provisionTenantIfNeeded(String tenantId) {
        // Ignorar si es master o si ya existe en memoria
        if (tenantId == null || "db_master_admin".equals(tenantId) || tenantRoutingDataSource.hasTenant(tenantId)) {
            return;
        }

        String dbName = "bd_brosteria_" + tenantId.toLowerCase();
        
        System.out.println(">>> APROVISIONANDO NUEVO INQUILINO: " + tenantId + " <<<");

        // 1. Crear base de datos física en MySQL
        try (Connection conn = DriverManager.getConnection(masterUrl, masterUsername, masterPassword);
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("CREATE DATABASE IF NOT EXISTS " + dbName + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (SQLException e) {
            throw new RuntimeException("Error creando base de datos para inquilino: " + tenantId, e);
        }

        // 2. Crear nuevo pool de conexiones
        String tenantUrl = masterUrl.replace("defaultdb", dbName);
        HikariDataSource dataSource = (HikariDataSource) DataSourceBuilder.create()
                .url(tenantUrl)
                .username(masterUsername)
                .password(masterPassword)
                .build();
        
        dataSource.setMaximumPoolSize(10); // Menos conexiones porque es on-demand
        dataSource.setMinimumIdle(2);
        dataSource.setIdleTimeout(300000);
        dataSource.setConnectionTimeout(20000);

        // 3. Inyectar estructura inicial de tablas
        Resource resource = resourceLoader.getResource("classpath:db-init.sql");
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(resource);
        populator.setContinueOnError(true); // Evita fallos si ya existen (por seguridad extra)
        DatabasePopulatorUtils.execute(populator, dataSource);

        // 4. Conectar la base de datos a Spring Boot dinamicamente
        tenantRoutingDataSource.addTenant(tenantId, dataSource);
        
        System.out.println(">>> INQUILINO " + tenantId + " APROVISIONADO CON ÉXITO <<<");
    }
}
