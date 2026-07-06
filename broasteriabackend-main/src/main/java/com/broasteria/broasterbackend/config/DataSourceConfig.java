package com.broasteria.broasterbackend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String masterUrl;

    @Value("${spring.datasource.username}")
    private String masterUsername;

    @Value("${spring.datasource.password}")
    private String masterPassword;

    @Bean
    public TenantRoutingDataSource dataSource() {
        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource();
        Map<Object, Object> dataSourceMap = new HashMap<>();

        // 1. Crear conexión principal (Master DB)
        DataSource masterDataSource = createDataSource(masterUrl, masterUsername, masterPassword);
        dataSourceMap.put("db_master_admin", masterDataSource);

        // Ya no hay hardcodeo. La creación de inquilinos como "juan" o "pedro"
        // es ahora manejada dinámicamente en tiempo de ejecución por TenantProvisioningService

        // Inicializamos el RoutingDataSource
        routingDataSource.init(masterDataSource, dataSourceMap);

        return routingDataSource;
    }

    private DataSource createDataSource(String url, String username, String password) {
        HikariDataSource dataSource = (HikariDataSource) DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .build();
        
        // Optimizaciones recomendadas de HikariCP para SaaS
        dataSource.setMaximumPoolSize(15);
        dataSource.setMinimumIdle(5);
        dataSource.setIdleTimeout(300000);
        dataSource.setConnectionTimeout(20000);
        dataSource.setMaxLifetime(1200000);

        return dataSource;
    }
}
