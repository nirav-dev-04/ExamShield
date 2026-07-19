package com.examshield.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.accessTokenExpirationMs}")
    private long jwtExpirationInMs;

    @Value("${app.jwt.refreshTokenExpirationMs}")
    private long refreshExpirationInMs;

    @Value("${app.jwt.cookieName}")
    private String cookieName;

    @Value("${app.jwt.refreshCookieName}")
    private String refreshCookieName;

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpirationInMs);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public void addAccessTokenCookie(HttpServletResponse response, String accessToken) {
        ResponseCookie accessCookie = ResponseCookie.from(cookieName, accessToken)
                .httpOnly(true)
                .secure(false) // Set true in production if running HTTPS
                .path("/")
                .maxAge(jwtExpirationInMs / 1000)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", accessCookie.toString());
    }

    public void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie refreshCookie = ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(false) // Set true in production if running HTTPS
                .path("/")
                .maxAge(refreshExpirationInMs / 1000)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }

    public void addJwtCookiesToResponse(HttpServletResponse response, String accessToken, String refreshToken) {
        addAccessTokenCookie(response, accessToken);
        addRefreshTokenCookie(response, refreshToken);
    }

    public void clearJwtCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", accessCookie.toString());
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }

    public String getJwtFromCookie(HttpServletRequest request) {
        return getCookieValue(request, cookieName);
    }

    public String getRefreshTokenFromCookie(HttpServletRequest request) {
        return getCookieValue(request, refreshCookieName);
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public String getUsernameFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public String getRoleFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            // Token is invalid, expired, or malformed
            return false;
        }
    }

    public String getRefreshCookieName() {
        return refreshCookieName;
    }
}
