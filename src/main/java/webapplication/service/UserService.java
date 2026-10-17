package webapplication.service;

import webapplication.model.Team;
import webapplication.model.User;
import webapplication.repository.TeamRepository;
import webapplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages user CRUD, login validation, team assignment, job title operations,
 * and password resets.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Demo-only flag: when true, the direct password-reset endpoint is allowed.
     * Disabled by default so a deployed instance is not open to account takeover.
     */
    @Value("${app.demo.reset-enabled:false}")
    private boolean demoResetEnabled;

    public UserService(UserRepository userRepository,
                       TeamRepository teamRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User createUser(User user) {
        String normalizedEmail = user.getEmail().trim().toLowerCase();
        user.setEmail(normalizedEmail);

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        User user = getUserById(id);
        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail().trim().toLowerCase());
        user.setRole(updatedUser.getRole());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User login(String email, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .orElse(null);
    }

    public User updateTeam(Long id, String teamName) {
        User user = getUserById(id);
        if (teamName == null || teamName.isBlank()) {
            user.setTeam(null);
        } else {
            Team team = teamRepository.findByName(teamName)
                    .orElseThrow(() -> new RuntimeException("Team not found: " + teamName));
            user.setTeam(team);
        }
        return userRepository.save(user);
    }

    public User updateJobTitle(Long id, String jobTitle) {
        User user = getUserById(id);
        user.setJobTitle(jobTitle);
        return userRepository.save(user);
    }

    // ===================== DIRECT PASSWORD RESET (DEMO ONLY) =====================

    /**
     * Directly replaces a user's password given their email.
     * <p>
     * <b>This is only intended for offline / demo environments where email
     * delivery is unavailable.</b> It is gated behind the
     * {@code app.demo.reset-enabled} property which MUST be false (the default)
     * in any real deployment — otherwise this is an account-takeover endpoint.
     *
     * @param email       The email of the account to update
     * @param newPassword The new plain-text password
     */
    public void resetPasswordByEmail(String email, String newPassword) {
        if (!demoResetEnabled) {
            throw new IllegalStateException(
                    "Direct password reset is disabled. Use the token-based reset flow.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (!newPassword.matches("^(?=.*[A-Za-z])(?=.*\\d).+$")) {
            throw new IllegalArgumentException("Password must contain at least one letter and one number");
        }

        String normalized = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(() -> new RuntimeException("No account found with that email"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}