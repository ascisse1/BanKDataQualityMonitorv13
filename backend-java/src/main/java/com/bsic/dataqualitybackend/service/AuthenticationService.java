package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    public String authenticate(String username, String password) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(userDetails);

            userService.updateLastLogin(username);

            log.info("User authenticated successfully: {}", username);
            return token;

        } catch (BadCredentialsException e) {
            userService.incrementFailedLoginAttempts(username);
            log.warn("Failed login attempt for user: {}", username);
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    public User getCurrentUser(String username) {
        return userService.getUserByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }
}
