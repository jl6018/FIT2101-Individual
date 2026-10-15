import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import webapplication.Application;
import webapplication.model.User;
import webapplication.repository.UserRepository;
import webapplication.service.EmailService;
import webapplication.service.UserService;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for UserService.
 * Tests user creation, retrieval, update, deletion, email lookup,
 * BCrypt password hashing, login verification, and the password-reset flows
 * (both the email-token flow and the direct demo flow).
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:userdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.mail.username=",
        "app.frontend.base-url=http://localhost:8081"
})
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Mocked so no SMTP connection is attempted and no real email is sent.
     */
    @MockitoBean
    private EmailService emailService;

    private User testUser;

    /**
     * Sets up fresh test data before each test.
     */
    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setRole("EMPLOYEE");
    }

    // ===================== CREATE =====================

    /**
     * Tests that creating a user saves it with the correct details,
     * and that the stored password is a BCrypt hash — not the raw value.
     */
    @Test
    void testCreateUser_Success() {
        User created = userService.createUser(testUser);

        assertNotNull(created.getId());
        assertEquals("Test User", created.getName());
        assertEquals("test@example.com", created.getEmail());
        assertEquals("EMPLOYEE", created.getRole());

        assertNotEquals("password123", created.getPassword());
        assertTrue(created.getPassword().startsWith("$2"),
                "Password should be a BCrypt hash starting with $2");
        assertTrue(passwordEncoder.matches("password123", created.getPassword()),
                "Stored hash should match the original raw password");
    }

    /**
     * Tests that creating a user with a duplicate email throws.
     */
    @Test
    void testCreateUser_DuplicateEmail_ThrowsException() {
        userService.createUser(testUser);

        User duplicate = new User();
        duplicate.setName("Another User");
        duplicate.setEmail("test@example.com");
        duplicate.setPassword("password123");
        duplicate.setRole("EMPLOYEE");

        assertThrows(RuntimeException.class, () -> userService.createUser(duplicate));
    }

    // ===================== READ =====================

    /**
     * Tests that retrieving all users returns the correct count.
     */
    @Test
    void testGetAllUsers_Success() {
        userService.createUser(testUser);

        User secondUser = new User();
        secondUser.setName("Second User");
        secondUser.setEmail("second@example.com");
        secondUser.setPassword("password123");
        secondUser.setRole("ADMIN");
        userService.createUser(secondUser);

        List<User> users = userService.getAllUsers();

        assertNotNull(users);
        assertEquals(2, users.size());
    }

    /**
     * Tests that retrieving a user by ID returns the correct user.
     */
    @Test
    void testGetUserById_Success() {
        User saved = userService.createUser(testUser);

        User found = userService.getUserById(saved.getId());

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("test@example.com", found.getEmail());
    }

    /**
     * Tests that retrieving a non-existent user throws an exception.
     */
    @Test
    void testGetUserById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> userService.getUserById(999L));
    }

    // ===================== UPDATE =====================

    /**
     * Tests that updating a user saves the new name, email, and role.
     */
    @Test
    void testUpdateUser_Success() {
        User saved = userService.createUser(testUser);

        User updatedUser = new User();
        updatedUser.setName("Updated Name");
        updatedUser.setEmail("updated@example.com");
        updatedUser.setPassword("password123");
        updatedUser.setRole("ADMIN");

        User updated = userService.updateUser(saved.getId(), updatedUser);

        assertEquals("Updated Name", updated.getName());
        assertEquals("updated@example.com", updated.getEmail());
        assertEquals("ADMIN", updated.getRole());
    }

    // ===================== DELETE =====================

    /**
     * Tests that deleting a user removes it from the database.
     */
    @Test
    void testDeleteUser_Success() {
        User saved = userService.createUser(testUser);

        userService.deleteUser(saved.getId());

        assertThrows(RuntimeException.class, () -> userService.getUserById(saved.getId()));
    }

    // ===================== FIND BY EMAIL =====================

    /**
     * Tests that finding a user by email returns the correct user.
     */
    @Test
    void testFindUserByEmail_Success() {
        User saved = userService.createUser(testUser);

        User found = userRepository.findByEmail("test@example.com").orElse(null);

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("test@example.com", found.getEmail());
    }

    // ===================== LOGIN =====================

    /**
     * Tests that login succeeds with correct credentials.
     */
    @Test
    void testLogin_Success() {
        userService.createUser(testUser);

        User loggedIn = userService.login("test@example.com", "password123");

        assertNotNull(loggedIn);
        assertEquals("test@example.com", loggedIn.getEmail());
    }

    /**
     * Tests that login is case-insensitive on the email side.
     */
    @Test
    void testLogin_EmailCaseInsensitive_Success() {
        userService.createUser(testUser);

        User loggedIn = userService.login("TEST@EXAMPLE.COM", "password123");

        assertNotNull(loggedIn);
        assertEquals("test@example.com", loggedIn.getEmail());
    }

    /**
     * Tests that login fails with the wrong password.
     */
    @Test
    void testLogin_WrongPassword_ReturnsNull() {
        userService.createUser(testUser);

        User loggedIn = userService.login("test@example.com", "WRONGPASSWORD");

        assertNull(loggedIn);
    }

    /**
     * Tests that login fails with an unknown email.
     */
    @Test
    void testLogin_UnknownEmail_ReturnsNull() {
        User loggedIn = userService.login("nobody@example.com", "password123");

        assertNull(loggedIn);
    }

    // ===================== FORGOT PASSWORD (email-token flow) =====================

    /**
     * Requesting a reset for a real user issues a token + expiry and
     * sends one email to that address.
     */
    @Test
    void testRequestPasswordReset_KnownEmail_IssuesTokenAndSendsEmail() {
        userService.createUser(testUser);

        userService.requestPasswordReset("test@example.com");

        User reloaded = userRepository.findByEmail("test@example.com").orElseThrow();
        assertNotNull(reloaded.getResetToken(), "Token should be set");
        assertNotNull(reloaded.getResetTokenExpiry(), "Expiry should be set");
        assertTrue(reloaded.getResetTokenExpiry().isAfter(LocalDateTime.now()),
                "Expiry should be in the future");

        verify(emailService).sendPasswordResetEmail(
                eq("test@example.com"),
                anyString(),
                contains("token="));
    }

    /**
     * Requesting a reset for an unknown email silently does nothing —
     * we do not reveal whether the email exists.
     */
    @Test
    void testRequestPasswordReset_UnknownEmail_NoOp() {
        userService.requestPasswordReset("nobody@example.com");

        assertNull(userRepository.findByEmail("nobody@example.com").orElse(null));
    }

    /**
     * Requesting a reset for a blank email does nothing.
     */
    @Test
    void testRequestPasswordReset_BlankEmail_NoOp() {
        assertDoesNotThrow(() -> userService.requestPasswordReset("   "));
    }

    // ===================== RESET PASSWORD (email-token flow) =====================

    /**
     * A valid token updates the password, clears the token, and clears the expiry.
     */
    @Test
    void testResetPassword_ValidToken_UpdatesPassword() {
        User saved = userService.createUser(testUser);
        String token = "testtoken12345";
        saved.setResetToken(token);
        saved.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(saved);

        userService.resetPassword(token, "newpass123");

        User reloaded = userRepository.findById(saved.getId()).orElseThrow();
        assertNull(reloaded.getResetToken(), "Token should be cleared after use");
        assertNull(reloaded.getResetTokenExpiry(), "Expiry should be cleared after use");
        assertTrue(passwordEncoder.matches("newpass123", reloaded.getPassword()),
                "New password should be hashed and stored");
    }

    /**
     * An unknown token is rejected.
     */
    @Test
    void testResetPassword_UnknownToken_Throws() {
        assertThrows(RuntimeException.class, () ->
                userService.resetPassword("bogus", "newpass123"));
    }

    /**
     * A blank token is rejected.
     */
    @Test
    void testResetPassword_BlankToken_Throws() {
        assertThrows(RuntimeException.class, () ->
                userService.resetPassword("   ", "newpass123"));
    }

    /**
     * An expired token is rejected, and the stale token is cleared.
     */
    @Test
    void testResetPassword_ExpiredToken_ThrowsAndClears() {
        User saved = userService.createUser(testUser);
        String token = "expiredtoken";
        saved.setResetToken(token);
        saved.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));
        userRepository.save(saved);

        assertThrows(RuntimeException.class, () ->
                userService.resetPassword(token, "newpass123"));

        User reloaded = userRepository.findById(saved.getId()).orElseThrow();
        assertNull(reloaded.getResetToken(), "Expired token should be cleared");
    }

    /**
     * A too-short password is rejected.
     */
    @Test
    void testResetPassword_WeakPassword_Throws() {
        User saved = userService.createUser(testUser);
        String token = "tok";
        saved.setResetToken(token);
        saved.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(saved);

        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPassword(token, "short"));
    }

    /**
     * A password without a digit is rejected.
     */
    @Test
    void testResetPassword_NoDigit_Throws() {
        User saved = userService.createUser(testUser);
        String token = "tok2";
        saved.setResetToken(token);
        saved.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(saved);

        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPassword(token, "onlyletters"));
    }

    // ===================== RESET PASSWORD DIRECT (demo flow) =====================

    /**
     * Direct reset updates the password when the email exists.
     */
    @Test
    void testResetPasswordByEmail_Success() {
        User saved = userService.createUser(testUser);

        userService.resetPasswordByEmail("test@example.com", "brandnew123");

        User reloaded = userRepository.findById(saved.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("brandnew123", reloaded.getPassword()));
    }

    /**
     * Direct reset with an unknown email throws.
     */
    @Test
    void testResetPasswordByEmail_UnknownEmail_Throws() {
        assertThrows(RuntimeException.class, () ->
                userService.resetPasswordByEmail("nobody@example.com", "brandnew123"));
    }

    /**
     * Direct reset with a weak password throws.
     */
    @Test
    void testResetPasswordByEmail_WeakPassword_Throws() {
        userService.createUser(testUser);

        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPasswordByEmail("test@example.com", "short"));
    }

    /**
     * Direct reset with a blank email throws.
     */
    @Test
    void testResetPasswordByEmail_BlankEmail_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPasswordByEmail("   ", "brandnew123"));
    }

    /**
     * Direct reset is case-insensitive on the email side.
     */
    @Test
    void testResetPasswordByEmail_EmailCaseInsensitive() {
        userService.createUser(testUser);

        userService.resetPasswordByEmail("TEST@EXAMPLE.COM", "brandnew123");

        User reloaded = userRepository.findByEmail("test@example.com").orElseThrow();
        assertTrue(passwordEncoder.matches("brandnew123", reloaded.getPassword()));
    }

    // ===================== TOKEN VALIDATION =====================

    @Test
    void testIsResetTokenValid_ValidToken_ReturnsTrue() {
        User saved = userService.createUser(testUser);
        String token = "validtoken";
        saved.setResetToken(token);
        saved.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(saved);

        assertTrue(userService.isResetTokenValid(token));
    }

    @Test
    void testIsResetTokenValid_ExpiredToken_ReturnsFalse() {
        User saved = userService.createUser(testUser);
        String token = "expiredtoken";
        saved.setResetToken(token);
        saved.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));
        userRepository.save(saved);

        assertFalse(userService.isResetTokenValid(token));
    }

    @Test
    void testIsResetTokenValid_UnknownToken_ReturnsFalse() {
        assertFalse(userService.isResetTokenValid("nope"));
    }

    @Test
    void testIsResetTokenValid_NullToken_ReturnsFalse() {
        assertFalse(userService.isResetTokenValid(null));
    }
}