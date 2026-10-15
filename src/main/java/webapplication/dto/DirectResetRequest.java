package webapplication.dto;

/**
 * Request body for the direct password-reset endpoint used in demo
 * environments where email delivery is unavailable.
 * Carries the user's email and the new password they want to set.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class DirectResetRequest {

    private String email;
    private String newPassword;

    public DirectResetRequest() {
    }

    public DirectResetRequest(String email, String newPassword) {
        this.email = email;
        this.newPassword = newPassword;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}