package com.bdspm.security;

import com.bdspm.domain.entity.User;
import com.bdspm.domain.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Dual-key security: after OAuth2 login, API access requires X-Agent-Username header.
 * Validates that username + email (from Google) match the same active user in DB.
 */
@Component
public class AgentUsernameFilter extends OncePerRequestFilter {

    public static final String X_AGENT_USERNAME = "X-Agent-Username";

    private final UserRepository userRepository;

    public AgentUsernameFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof OAuth2User)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Already resolved to our User
        if (auth.getPrincipal() instanceof User) {
            filterChain.doFilter(request, response);
            return;
        }

        // API requests require X-Agent-Username when principal is still OAuth2User
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String username = request.getHeader(X_AGENT_USERNAME);
        if (!StringUtils.hasText(username)) {
            throw new AccessDeniedException("Missing " + X_AGENT_USERNAME + " header");
        }

        OAuth2User oauth2User = (OAuth2User) auth.getPrincipal();
        String email = Optional.ofNullable(oauth2User.getAttribute("email"))
                .map(Object::toString)
                .orElse(null);
        if (!StringUtils.hasText(email)) {
            throw new AccessDeniedException("Email not available from OAuth2 user");
        }

        User user = userRepository.findByUsernameAndEmailAndActiveTrue(username, email)
                .orElseThrow(() -> new AccessDeniedException("Username and email do not match an active user"));

        var newAuth = new UsernamePasswordAuthenticationToken(
                user,
                auth.getCredentials(),
                AuthorityUtils.createAuthorityList("ROLE_" + user.getRole().name())
        );
        SecurityContextHolder.getContext().setAuthentication(newAuth);

        filterChain.doFilter(request, response);
    }
}
