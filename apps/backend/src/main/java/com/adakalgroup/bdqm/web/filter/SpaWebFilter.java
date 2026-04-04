package com.adakalgroup.bdqm.web.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * SPA filter to forward all non-API, non-static routes to index.html.
 * This allows React Router to handle client-side routing.
 *
 * Inspired by JHipster's SpaWebFilter.
 */
public class SpaWebFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        // Only forward GET requests (not API calls, not static assets, not auth endpoints)
        if (!path.startsWith("/api") &&
            !path.startsWith("/oauth2") &&
            !path.startsWith("/login/oauth2") &&
            !path.startsWith("/logout") &&
            !path.startsWith("/management") &&
            !path.startsWith("/v3/api-docs") &&
            !path.startsWith("/swagger-ui") &&
            !path.contains(".") &&
            path.matches("/(.*)")) {
            request.getRequestDispatcher("/index.html").forward(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
