package com.broasteria.broasterbackend.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class TenantRoutingDataSource extends AbstractRoutingDataSource {

    private final Map<Object, Object> dataSources = new ConcurrentHashMap<>();

    public void init(DataSource defaultDataSource, Map<Object, Object> initialDataSources) {
        this.dataSources.putAll(initialDataSources);
        this.setTargetDataSources(this.dataSources);
        this.setDefaultTargetDataSource(defaultDataSource);
        this.afterPropertiesSet();
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getCurrentTenant();
    }

    public boolean hasTenant(String tenantId) {
        return dataSources.containsKey(tenantId);
    }

    public void addTenant(String tenantId, DataSource dataSource) {
        dataSources.put(tenantId, dataSource);
        this.setTargetDataSources(dataSources);
        this.afterPropertiesSet(); // Re-construye el mapa interno resuelto de Spring
    }
}
