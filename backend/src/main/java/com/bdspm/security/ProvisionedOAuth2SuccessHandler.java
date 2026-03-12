package com.bdspm.security;

import com.bdspm.domain.entity.User;
import com.bdspm.domain.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
public class ProvisionedOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final String FRONTEND_LOGIN_URL = "http://localhost:3000/";
    private static final String FRONTEND_DASHBOARD_URL = "http://localhost:3000/dashboard";

    private final UserRepository userRepository;

    public ProvisionedOAuth2SuccessHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        HttpSession session = request.getSession(false);
        String username = session == null
                ? null
                : (String) session.getAttribute(AuthSessionAttributes.PENDING_AGENT_USERNAME);

        if (!StringUtils.hasText(username) || !(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            rejectLogin(request, response, "missing_agent_username", username);
            return;
        }

        String email = Optional.ofNullable(oauth2User.<String>getAttribute("email")).orElse(null);
        if (!StringUtils.hasText(email)) {
            rejectLogin(request, response, "missing_google_email", username);
            return;
        }

        User user = userRepository.findByUsernameAndEmailAndActiveTrue(username.trim(), email)
                .orElse(null);
        if (user == null) {
            rejectLogin(request, response, "username_email_mismatch", username);
            return;
        }

        var resolvedAuth = new UsernamePasswordAuthenticationToken(
                user,
                authentication.getCredentials(),
                AuthorityUtils.createAuthorityList("ROLE_" + user.getRole().name())
        );
        resolvedAuth.setDetails(authentication.getDetails());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(resolvedAuth);
        SecurityContextHolder.setContext(context);

        HttpSession targetSession = request.getSession(true);
        targetSession.removeAttribute(AuthSessionAttributes.PENDING_AGENT_USERNAME);
        targetSession.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        response.sendRedirect(FRONTEND_DASHBOARD_URL);
    }

    private void rejectLogin(HttpServletRequest request, HttpServletResponse response,
                             String errorCode, String username) throws IOException {
        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        expireCookie(response, "BDSPM_SESSION");
        expireCookie(response, "JSESSIONID");

        String redirectUrl = UriComponentsBuilder.fromHttpUrl(FRONTEND_LOGIN_URL)
                .queryParam("error", errorCode)
                .queryParamIfPresent("username", Optional.ofNullable(username).filter(StringUtils::hasText))
                .build(true)
                .toUriString();
        response.sendRedirect(redirectUrl);
    }

    private void expireCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, "");
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
