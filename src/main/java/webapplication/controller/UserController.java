package webapplication.controller;

import jakarta.validation.Valid;
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
 * Handles user CRUD operations, login, team assignment, and job title updates.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;

    /**
     * Parameterized constructor with the required UserService dependency.
     *
     * @param userService The service handling user business logic
     */
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Retrieves all users from the database.
     *
     * @return A list of all users
     */
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    /**
     * Retrieves a single user by their unique ID.
     *
     * @param id The ID of the user to retrieve
     * @return   The User object
     */
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    /**
     * Creates a new user if the email is not already registered.
     *
     * @param user              The User object to save
     * @return                  A ResponseEntity with the saved user, or an error message on failure
     */
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody User user) {
        // US20: Product Owners can only register through their invite link
        if ("PRODUCT_OWNER".equals(user.getRole())) {
            return ResponseEntity.status(403)
                    .body("Product Owners can only register through an invitation link.");
        }
        try {
            return ResponseEntity.ok(userService.createUser(user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    /**
     * Updates an existing user's name, email, and role.
     *
     * @param id   The ID of the user to update
     * @param user The User object containing the updated details
     * @return     The updated User object
     */
    @PutMapping("/{id}")
    public User updateUser(
            @PathVariable Long id,
            @Valid @RequestBody User user) {
        return userService.updateUser(id, user);
    }

    /**
     * Deletes a user from the database by their ID.
     *
     * @param id The ID of the user to delete
     */
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    /**
     * Authenticates a user and returns their profile with team information.
     *
     * @param loginRequest      The login credentials containing email and password
     * @return                  A ResponseEntity with the login response on success, or an error message on failure
     */
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

    /**
     * Updates a user's team assignment.
     *
     * @param id                The ID of the user to update
     * @param body              A map containing the team name
     * @return                  A ResponseEntity with the updated user, or an error message on failure
     */
    @PutMapping("/{id}/team")
    public ResponseEntity<?> updateTeam(@PathVariable Long id,
                                        @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(userService.updateTeam(id, body.get("team")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    /**
     * Updates a user's job title.
     *
     * @param id                The ID of the user to update
     * @param body              A map containing the job title
     * @return                  A ResponseEntity with the updated user, or an error message on failure
     */
    @PutMapping("/{id}/job-title")
    public ResponseEntity<?> updateJobTitle(@PathVariable Long id,
                                            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(userService.updateJobTitle(id, body.get("jobTitle")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    /**
     * Handles validation errors for request bodies.
     *
     * @param ex The exception containing field validation errors
     * @return   A ResponseEntity with the first validation error message
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getDefaultMessage())
                .findFirst()
                .orElse("Invalid request");
        return ResponseEntity.status(400).body(message);
    }
}