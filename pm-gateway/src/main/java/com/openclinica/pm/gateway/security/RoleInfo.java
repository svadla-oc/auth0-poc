package com.openclinica.pm.gateway.security;

/**
 * Created by shivavadla on 4/3/17.
 */
public class RoleInfo {
    private String studyId;
    private String roleName;

    public String getStudyId() {
        return studyId;
    }

    public void setStudyId(String studyId) {
        this.studyId = studyId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}
