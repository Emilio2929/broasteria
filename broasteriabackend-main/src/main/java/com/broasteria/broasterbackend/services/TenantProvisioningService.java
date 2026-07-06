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

        boolean isNewDatabase = false;

        // 1. Verificar si la base de datos ya existe y crearla si no
        try (Connection conn = DriverManager.getConnection(masterUrl, masterUsername, masterPassword);
             Statement stmt = conn.createStatement()) {
             
            // Verificamos si ya existe físicamente en MySQL
            var rs = stmt.executeQuery("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '" + dbName + "'");
            if (!rs.next()) {
                isNewDatabase = true; // Es totalmente nueva!
                stmt.executeUpdate("CREATE DATABASE " + dbName + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
            
        } catch (SQLException e) {
            throw new RuntimeException("Error creando base de datos para inquilino: " + tenantId, e);
        }

        // 2. Crear nuevo pool de conexiones hacia esa base de datos (nueva o existente)
        String tenantUrl = masterUrl.replace("defaultdb", dbName);
        HikariDataSource dataSource = (HikariDataSource) DataSourceBuilder.create()
                .url(tenantUrl)
                .username(masterUsername)
                .password(masterPassword)
                .build();
        
        dataSource.setMaximumPoolSize(10);
        dataSource.setMinimumIdle(2);
        dataSource.setIdleTimeout(300000);
        dataSource.setConnectionTimeout(20000);

        // 3. SOLO inyectar las tablas iniciales si la base de datos se acaba de crear por primera vez
        // Si el servidor se reinició, la base de datos ya existía, así que NO tocamos los datos del cliente.
        if (isNewDatabase) {
            Resource resource = resourceLoader.getResource("classpath:db-init.sql");
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator(resource);
            populator.setContinueOnError(true);
            DatabasePopulatorUtils.execute(populator, dataSource);
            System.out.println(">>> TABLAS Y MENÚ BASE INYECTADOS PARA " + tenantId + " <<<");
        } else {
            System.out.println(">>> LA BD DE " + tenantId + " YA EXISTÍA. RECUPERANDO CONEXIÓN SIN TOCAR SUS DATOS <<<");
        }

        // 4. Conectar la base de datos a Spring Boot dinamicamente
        tenantRoutingDataSource.addTenant(tenantId, dataSource);
        
        System.out.println(">>> INQUILINO " + tenantId + " APROVISIONADO CON ÉXITO <<<");
    }
}
