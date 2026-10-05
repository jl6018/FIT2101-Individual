package webapplication.login;

public class LoginResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String team;   // ✅ NEW

    public LoginResponse() {
    }

    public LoginResponse(Long id, String name, String email, String role, String team) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.team = team;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    // ✅ NEW
    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }
}