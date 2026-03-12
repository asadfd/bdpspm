package com.bdspm.api;

import com.bdspm.domain.entity.User;
import com.bdspm.domain.repository.UserRepository;
import com.bdspm.security.AuthSessionAttributes;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/login/google")
    public void beginGoogleLogin(@RequestParam(name = "username", required = false) String username,
                                 HttpServletRequest request,
                                 HttpServletResponse response) throws java.io.IOException {
        String normalizedUsername = username == null ? "" : username.trim();
        if (!StringUtils.hasText(normalizedUsername)) {
            response.sendRedirect(frontendLoginRedirect("missing_agent_username", null));
            return;
        }

        if (userRepository.findByUsernameAndActiveTrue(normalizedUsername).isEmpty()) {
            response.sendRedirect(frontendLoginRedirect("unknown_user", normalizedUsername));
            return;
        }

        request.getSession(true).setAttribute(AuthSessionAttributes.PENDING_AGENT_USERNAME, normalizedUsername);
        response.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * Returns the currently authenticated user's details.
     * Works whether the principal has been resolved to a full User entity
     * (by AgentUsernameFilter on /api/** calls) or is still an OAuth2User
     * (on non-/api/** paths like this one).
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal Object principal) {
        if (principal instanceof User user) {
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "role", user.getRole().name()
            ));
        }
        return ResponseEntity.status(403).body(Map.of("error", "Agent session is not provisioned."));
    }

    @GetMapping("/csrf")
    public ResponseEntity<?> getCsrfToken(CsrfToken csrfToken) {
        return ResponseEntity.ok(Map.of(
                "token", csrfToken.getToken(),
                "headerName", csrfToken.getHeaderName(),
                "parameterName", csrfToken.getParameterName()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session, HttpServletResponse response) {
        session.invalidate();
        expireCookie(response, "BDSPM_SESSION");
        expireCookie(response, "JSESSIONID");
        return ResponseEntity.ok().build();
    }

    private void expireCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, "");
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String frontendLoginRedirect(String errorCode, String username) {
        return UriComponentsBuilder.fromHttpUrl("http://localhost:3000/")
                .queryParam("error", errorCode)
                .queryParamIfPresent("username", java.util.Optional.ofNullable(username).filter(StringUtils::hasText))
                .build(true)
                .toUriString();
    }
}
