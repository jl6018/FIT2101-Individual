package webapplication.dto;

/**
 * Request body for the "forgot password" endpoint.
 * Carries only the email address the user typed in.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public class ForgotPasswordRequest {

    private String email;

    public ForgotPasswordRequest() {
    }

    public ForgotPasswordRequest(String email) {
        this.email = email;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}