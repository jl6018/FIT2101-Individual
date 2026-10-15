package webapplication.dto;

/**
 * Request body for the "reset password" endpoint.
 * Carries the one-time token from the email link plus the new password.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class ResetPasswordRequest {

    private String token;
    private String newPassword;

    public ResetPasswordRequest() {
    }

    public ResetPasswordRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}