import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

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
     * Tests that creating a user saves it with the correct details.
     */
    @Test
    void testCreateUser_Success() {
        User created = userService.createUser(testUser);

        assertNotNull(created.getId());
        assertEquals("Test User", created.getName());
        assertEquals("test@example.com", created.getEmail());
        assertEquals("EMPLOYEE", created.getRole());
        assertEquals("password123", created.getPassword());
    }

    /**
     * Tests that creating a user with a duplicate email throws an exception.
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
     * Tests that a user can be found by email.
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
     * Tests that a valid email and password logs the user in.
     */
    @Test
    void testLogin_Success() {
        userService.createUser(testUser);

        User loggedIn = userService.login("test@example.com", "password123");

        assertNotNull(loggedIn);
        assertEquals("test@example.com", loggedIn.getEmail());
    }

    /**
     * Tests that login is case-insensitive for the email.
     */
    @Test
    void testLogin_EmailCaseInsensitive_Success() {
        userService.createUser(testUser);

        User loggedIn = userService.login("TEST@EXAMPLE.COM", "password123");

        assertNotNull(loggedIn);
        assertEquals("test@example.com", loggedIn.getEmail());
    }

    /**
     * Tests that a wrong password returns null instead of a user.
     */
    @Test
    void testLogin_WrongPassword_ReturnsNull() {
        userService.createUser(testUser);

        User loggedIn = userService.login("test@example.com", "WRONGPASSWORD");

        assertNull(loggedIn);
    }

    /**
     * Tests that an unknown email returns null.
     */
    @Test
    void testLogin_UnknownEmail_ReturnsNull() {
        User loggedIn = userService.login("nobody@example.com", "password123");

        assertNull(loggedIn);
    }
}