package com.bdspm.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final AgentUsernameFilter agentUsernameFilter;
    private final ProvisionedOAuth2SuccessHandler provisionedOAuth2SuccessHandler;
    private final CsrfCookieFilter csrfCookieFilter;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService,
                          AgentUsernameFilter agentUsernameFilter,
                          ProvisionedOAuth2SuccessHandler provisionedOAuth2SuccessHandler,
                          CsrfCookieFilter csrfCookieFilter) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.agentUsernameFilter = agentUsernameFilter;
        this.provisionedOAuth2SuccessHandler = provisionedOAuth2SuccessHandler;
        this.csrfCookieFilter = csrfCookieFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        SpaCsrfTokenRequestHandler csrfTokenRequestHandler = new SpaCsrfTokenRequestHandler();

        http
                // Enable CSRF protection with cookie-based token for browser clients
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(csrfTokenRequestHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/login**", "/oauth2/**", "/error", "/auth/login/google").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(ui -> ui.userService(customOAuth2UserService))
                        .successHandler(provisionedOAuth2SuccessHandler)
                        .failureUrl("http://localhost:3000/?error=oauth_failed")
                )
                .sessionManagement(session -> session
                        .sessionFixation().migrateSession()
                )
                .exceptionHandling(ex -> ex
                        .accessDeniedHandler(new JsonAccessDeniedHandler())
                )
                .addFilterAfter(csrfCookieFilter, CsrfFilter.class)
                .addFilterAfter(agentUsernameFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
