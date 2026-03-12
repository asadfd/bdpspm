package com.bdspm.security;

import com.bdspm.domain.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * Delegates to default OAuth2 user loading. Google userinfo includes "email" in attributes.
 * Dual-key validation (X-Agent-Username + email match in DB) is performed by AgentUsernameFilter.
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    public CustomOAuth2UserService() {
        super();
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        // Google provides "email" in attributes; AgentUsernameFilter will validate with DB
        return oauth2User;
    }
}
