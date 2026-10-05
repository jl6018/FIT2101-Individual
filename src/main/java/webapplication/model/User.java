package webapplication.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$",
            message = "Name can only contain letters, spaces, hyphens, and apostrophes")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a proper email like user@example.com")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Password must contain at least one letter and one number")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "ADMIN|EMPLOYEE", message = "Role must be ADMIN or EMPLOYEE")
    private String role;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    // ✅ @JsonIgnore REMOVED — now team info is included in JSON
    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    public User() {
    }

    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
}