package com.openclinica.pm.gateway.security;

import java.util.List;

/**
 * Created by shivavadla on 4/3/17.
 */
public class UserContext {
    private String userType;
    private List<RoleInfo> rolesVersion1;

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public List<RoleInfo> getRolesVersion1() {
        return rolesVersion1;
    }

    public void setRolesVersion1(List<RoleInfo> rolesVersion1) {
        this.rolesVersion1 = rolesVersion1;
    }
}
