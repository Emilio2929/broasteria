package com.broasteria.broasterbackend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import com.broasteria.broasterbackend.services.TenantProvisioningService;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class TenantFilter implements Filter {

    @Autowired
    private TenantProvisioningService tenantProvisioningService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        
        // Extracción de la cabecera HTTP inyectada por el cliente web
        String tenantId = req.getHeader("X-Tenant-ID");
        
        if (tenantId != null && !tenantId.isEmpty()) {
            tenantProvisioningService.provisionTenantIfNeeded(tenantId);
            TenantContext.setCurrentTenant(tenantId);
        } else {
            TenantContext.setCurrentTenant("db_master_admin"); // Base de datos por defecto
        }
        
        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear(); // Limpieza estricta del hilo para evitar contaminación de memoria
        }
    }
}
