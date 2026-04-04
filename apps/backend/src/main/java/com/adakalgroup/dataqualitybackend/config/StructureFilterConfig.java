package com.adakalgroup.dataqualitybackend.config;

import com.adakalgroup.dataqualitybackend.security.StructureFilterContext;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * AOP Aspect that enables the Hibernate "structureFilter" before any
 * Spring Data JPA repository method executes.
 *
 * Why AOP instead of servlet filter / interceptor:
 * - The Hibernate Session must be the SAME session used by the repository query.
 * - Servlet filters and HandlerInterceptors run before the transaction/session is created.
 * - AOP @Before on repository methods runs INSIDE the transaction, on the correct session.
 *
 * ADMIN/AUDITOR → global access → filter not enabled.
 * Scheduled tasks → no request scope → filter not enabled.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class StructureFilterConfig {

    private final EntityManager entityManager;
    private final StructureFilterContext filterContext;

    @Before("execution(* org.springframework.data.jpa.repository.JpaRepository+.*(..))")
    public void enableStructureFilter() {
        try {
            if (filterContext.isGlobalAccess()) {
                return;
            }

            List<String> codes = filterContext.getStructureCodes();
            if (codes.isEmpty()) {
                return;
            }

            Session session = entityManager.unwrap(Session.class);
            if (session.getEnabledFilter("structureFilter") == null) {
                session.enableFilter("structureFilter")
                       .setParameterList("codes", codes);
                log.info("structureFilter enabled with codes: {}", codes);
            }
        } catch (org.springframework.beans.factory.BeanCreationException e) {
            // No request scope (scheduled task, async, etc.) → no filtering
        } catch (Exception e) {
            log.debug("structureFilter not applied: {}", e.getMessage());
        }
    }
}
