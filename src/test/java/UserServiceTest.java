import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import webapplication.Application;
import webapplication.model.User;
import webapplication.repository.UserRepository;
import webapplication.service.UserService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UserService.
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
        "app.demo.reset-enabled=true"
})
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

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

    @Test
    void testGetUserById_Success() {
        User saved = userService.createUser(testUser);

        User found = userService.getUserById(saved.getId());

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("test@example.com", found.getEmail());
    }

    @Test
    void testGetUserById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> userService.getUserById(999L));
    }

    // ===================== UPDATE =====================

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

    @Test
    void testDeleteUser_Success() {
        User saved = userService.createUser(testUser);

        userService.deleteUser(saved.getId());

        assertThrows(RuntimeException.class, () -> userService.getUserById(saved.getId()));
    }

    // ===================== FIND BY EMAIL =====================

    @Test
    void testFindUserByEmail_Success() {
        User saved = userService.createUser(testUser);

        User found = userRepository.findByEmail("test@example.com").orElse(null);

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("test@example.com", found.getEmail());
    }

    // ===================== LOGIN =====================

    @Test
    void testLogin_Success() {
        userService.createUser(testUser);

        User loggedIn = userService.login("test@example.com", "password123");

        assertNotNull(loggedIn);
        assertEquals("test@example.com", loggedIn.getEmail());
    }

    @Test
    void testLogin_EmailCaseInsensitive_Success() {
        userService.createUser(testUser);

        User loggedIn = userService.login("TEST@EXAMPLE.COM", "password123");

        assertNotNull(loggedIn);
        assertEquals("test@example.com", loggedIn.getEmail());
    }

    @Test
    void testLogin_WrongPassword_ReturnsNull() {
        userService.createUser(testUser);

        User loggedIn = userService.login("test@example.com", "WRONGPASSWORD");

        assertNull(loggedIn);
    }

    @Test
    void testLogin_UnknownEmail_ReturnsNull() {
        User loggedIn = userService.login("nobody@example.com", "password123");

        assertNull(loggedIn);
    }

    // ===================== DIRECT PASSWORD RESET (DEMO FLOW) =====================

    @Test
    void testResetPasswordByEmail_Success() {
        User saved = userService.createUser(testUser);

        userService.resetPasswordByEmail("test@example.com", "brandnew123");

        User reloaded = userRepository.findById(saved.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("brandnew123", reloaded.getPassword()));
    }

    @Test
    void testResetPasswordByEmail_UnknownEmail_Throws() {
        assertThrows(RuntimeException.class, () ->
                userService.resetPasswordByEmail("nobody@example.com", "brandnew123"));
    }

    @Test
    void testResetPasswordByEmail_WeakPassword_Throws() {
        userService.createUser(testUser);

        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPasswordByEmail("test@example.com", "short"));
    }

    @Test
    void testResetPasswordByEmail_BlankEmail_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPasswordByEmail("   ", "brandnew123"));
    }

    @Test
    void testResetPasswordByEmail_EmailCaseInsensitive() {
        userService.createUser(testUser);

        userService.resetPasswordByEmail("TEST@EXAMPLE.COM", "brandnew123");

        User reloaded = userRepository.findByEmail("test@example.com").orElseThrow();
        assertTrue(passwordEncoder.matches("brandnew123", reloaded.getPassword()));
    }

    @Test
    void testResetPasswordByEmail_EnabledInCurrentContext() {
        // Verifies the demo flag was read correctly (true in this context),
        // so the flow is allowed.
        userService.createUser(testUser);
        assertDoesNotThrow(() ->
                userService.resetPasswordByEmail("test@example.com", "brandnew123"));
    }
}