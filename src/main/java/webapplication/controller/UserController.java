package webapplication.controller;

import jakarta.validation.Valid;
import webapplication.login.LoginRequest;
import webapplication.login.LoginResponse;
import webapplication.model.User;
import webapplication.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public User updateUser(
            @PathVariable Long id,
            @Valid @RequestBody User user) {
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
        LoginResponse response = new LoginResponse(
                user.getId(), user.getName(), user.getEmail(), user.getRole()
        );
        return ResponseEntity.ok(response);
    }

    // ===================== HANDLE VALIDATION ERRORS =====================
    // Returns the field error message as plain text
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