package com.openclinica.pm.gateway.security.jwt;

import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.JWTVerifyException;
import com.auth0.jwt.pem.X509CertUtils;
import com.auth0.spring.security.auth0.Auth0JWTToken;
import com.auth0.spring.security.auth0.Auth0TokenException;
import com.auth0.spring.security.auth0.Auth0UserDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclinica.pm.gateway.security.UserContext;
import com.openclinica.pm.gateway.security.UserContextHolder;
import io.github.jhipster.config.JHipsterProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.SignatureException;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.util.Date;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class TokenProvider {

    private final Logger log = LoggerFactory.getLogger(TokenProvider.class);

    private static final String AUTHORITIES_KEY = "auth";

    private String secretKey;

    private long tokenValidityInMilliseconds;

    private long tokenValidityInMillisecondsForRememberMe;

    private final JHipsterProperties jHipsterProperties;

    private JWTVerifier jwtVerifier;

    private static final String PUBLIC_KEY_PATH = "oc4.cer";

    private static final String USER_CONTEXT_CLAIM_NAME = "https://www.openclinica.com/userContext";

    public TokenProvider(JHipsterProperties jHipsterProperties) {
        this.jHipsterProperties = jHipsterProperties;
    }

    @PostConstruct
    public void init() {

        this.tokenValidityInMilliseconds =
            1000 * jHipsterProperties.getSecurity().getAuthentication().getJwt().getTokenValidityInSeconds();
        this.tokenValidityInMillisecondsForRememberMe =
            1000 * jHipsterProperties.getSecurity().getAuthentication().getJwt().getTokenValidityInSecondsForRememberMe();

        try {
            final ClassLoader classLoader = getClass().getClassLoader();
            InputStream inputStream = classLoader.getResourceAsStream(PUBLIC_KEY_PATH);
            byte[] certData = IOUtils.toByteArray(inputStream);
            final PublicKey publicKey = readPublicKey(certData);
            Validate.notNull(publicKey);
            jwtVerifier = new JWTVerifier(publicKey);
            return;
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e.getCause());
        }
    }

    /**
        Copied from com.auth0.jwt.pem.PemReader
     */
    private static PublicKey readPublicKey(byte[] data) throws InvalidKeySpecException, IOException {

        final X509Certificate cert = X509CertUtils.parse(new String(data));
        if (cert != null) {
            java.security.PublicKey publicKey = cert.getPublicKey();
            return publicKey;
        }
        return null;
    }

    public String createToken(Authentication authentication, Boolean rememberMe) {
        String authorities = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

        long now = (new Date()).getTime();
        Date validity;
        if (rememberMe) {
            validity = new Date(now + this.tokenValidityInMillisecondsForRememberMe);
        } else {
            validity = new Date(now + this.tokenValidityInMilliseconds);
        }

        return Jwts.builder()
            .setSubject(authentication.getName())
            .claim(AUTHORITIES_KEY, authorities)
            .signWith(SignatureAlgorithm.HS512, secretKey)
            .setExpiration(validity)
            .compact();
    }

    public UserContext getUserContext(String token) {
        try {
            final Map<String, Object> decoded = jwtVerifier.verify(token);
            Map userContextMap = (Map) decoded.get(USER_CONTEXT_CLAIM_NAME);
            if (userContextMap != null) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode userContextJson = new ObjectMapper().valueToTree(userContextMap);
                UserContext userContext = objectMapper.treeToValue(userContextJson, UserContext.class);
                return userContext;
            }

            return null;
        } catch (InvalidKeyException e) {
            throw new Auth0TokenException("InvalidKeyException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (NoSuchAlgorithmException e) {
            throw new Auth0TokenException("NoSuchAlgorithmException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (IllegalStateException e) {
            throw new Auth0TokenException("IllegalStateException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (SignatureException e) {
            throw new Auth0TokenException("SignatureException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (IOException e) {
            throw new Auth0TokenException("IOException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (JWTVerifyException e) {
            throw new Auth0TokenException("JWTVerifyException thrown while decoding JWT token " + e.getLocalizedMessage());
        }

    }

    public Authentication getAuthentication(String token) {
        final Auth0JWTToken authentication = new Auth0JWTToken(token);
        try {
            final Auth0JWTToken tokenAuth = authentication;
            final Map<String, Object> decoded = jwtVerifier.verify(token);

            tokenAuth.setAuthenticated(true);
            tokenAuth.setPrincipal(new Auth0UserDetails(decoded));
            tokenAuth.setDetails(decoded);
            return authentication;
        } catch (InvalidKeyException e) {
            throw new Auth0TokenException("InvalidKeyException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (NoSuchAlgorithmException e) {
            throw new Auth0TokenException("NoSuchAlgorithmException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (IllegalStateException e) {
            throw new Auth0TokenException("IllegalStateException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (SignatureException e) {
            throw new Auth0TokenException("SignatureException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (IOException e) {
            throw new Auth0TokenException("IOException thrown while decoding JWT token " + e.getLocalizedMessage());
        } catch (JWTVerifyException e) {
            throw new Auth0TokenException("JWTVerifyException thrown while decoding JWT token " + e.getLocalizedMessage());
        }
    }

    public boolean validateToken(String authToken) {
        try {
            jwtVerifier.verify(authToken);
            return true;
        } catch (IOException e) {
            log.info("Error reading the certificate.");
            log.trace("Error reading the certificate trace: {}", e);
        } catch (InvalidKeyException e) {
            log.info("Invalid key.");
            log.trace("Invalid key trace: {}", e);
        } catch (NoSuchAlgorithmException e) {
            log.info("Invalid signature algorithm.");
            log.trace("Invalid signature algorithm trace: {}", e);
        } catch (JWTVerifyException e) {
            log.info("Error validating JWT token.");
            log.trace("Error validating JWT token trace: {}", e);
        } catch (SignatureException e) {
            log.info("Invalid JWT signature.");
            log.trace("Invalid JWT signature trace: {}", e);
        }
        return false;
    }
}
