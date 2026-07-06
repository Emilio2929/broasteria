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
    public DataSource dataSource() {
        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource();
        Map<Object, Object> dataSourceMap = new HashMap<>();

        // Configuración de la base de datos maestra (db_master_admin)
        DataSource masterDataSource = createDataSource(masterUrl, masterUsername, masterPassword);
        dataSourceMap.put("db_master_admin", masterDataSource);

        /* 
         * CONFIGURACION DE PRUEBA (Hardcoded)
         * Reemplazamos 'defaultdb' de la URL original por las bases de datos de los clientes
         */
        String urlJuan = masterUrl.replace("defaultdb", "bd_brosteria_juan");
        DataSource juanDataSource = createDataSource(urlJuan, masterUsername, masterPassword);
        dataSourceMap.put("juan", juanDataSource);

        String urlPedro = masterUrl.replace("defaultdb", "bd_brosteria_pedro");
        DataSource pedroDataSource = createDataSource(urlPedro, masterUsername, masterPassword);
        dataSourceMap.put("pedro", pedroDataSource);

        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(masterDataSource);

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
