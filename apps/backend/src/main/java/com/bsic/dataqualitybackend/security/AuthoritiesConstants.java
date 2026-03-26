package com.bsic.dataqualitybackend.security;

/**
 * Constants for Spring Security authorities.
 */
public final class AuthoritiesConstants {

    public static final String ADMIN = "ROLE_ADMIN";

    public static final String USER = "ROLE_USER";

    public static final String ANONYMOUS = "ROLE_ANONYMOUS";

    public static final String COMPANY = "ROLE_COMPANY";

    public static final String SECRETARIAT_LCP = "ROLE_SECRETARIAT_LCP";

    public static final String SECRETARIAT_DIRECTOR = "ROLE_SECRETARIAT_DIRECTOR";

    private AuthoritiesConstants() {}
}
