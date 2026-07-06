package com.broasteria.broasterbackend.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

public class TenantRoutingDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        // Indica a Spring Data el identificador del pool correspondiente al hilo actual
        return TenantContext.getCurrentTenant();
    }
}
