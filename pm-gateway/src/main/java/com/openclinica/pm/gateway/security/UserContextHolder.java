package com.openclinica.pm.gateway.security;

/**
 * Created by shivavadla on 4/3/17.
 */
public class UserContextHolder {
    private static final ThreadLocal<UserContext> userContext = new ThreadLocal<>();

    public static UserContext getUserContext() {
        return userContext.get();
    }

    public static void setUserContext(UserContext userContext) {
        UserContextHolder.userContext.set(userContext);
    }
}
