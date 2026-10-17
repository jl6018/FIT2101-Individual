package webapplication.controller;

import jakarta.validation.Valid;
import webapplication.dto.DirectResetRequest;
import webapplication.dto.LoginRequest;
import webapplication.dto.LoginResponse;
import webapplication.model.User;
import webapplication.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Exposes REST endpoints for managing users and authentication.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.createUser(user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        return userService.updateUser(id, user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        User user = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
        if (user == null) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
        String teamName = user.getTeam() != null ? user.getTeam().getName() : null;
        LoginResponse response = new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                teamName
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/team")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(userService.updateTeam(id, body.get("team")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/job-title")
    public ResponseEntity<?> updateJobTitle(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(userService.updateJobTitle(id, body.get("jobTitle")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    // ===================== DIRECT PASSWORD RESET =====================

    /**
     * Direct reset endpoint: takes an email and a new password and updates
     * the password in one shot.
     */
    @PostMapping("/reset-password-direct")
    public ResponseEntity<?> resetPasswordDirect(@RequestBody DirectResetRequest req) {
        try {
            userService.resetPasswordByEmail(req.getEmail(), req.getNewPassword());
            return ResponseEntity.ok("Password updated successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage()).findFirst().orElse("Invalid request");
        return ResponseEntity.status(400).body(message);
    }
}