import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import webapplication.Application;
import webapplication.model.User;
import webapplication.repository.UserRepository;
import webapplication.service.UserService;

// Add these imports based on your actual project dependencies (e.g., Security, Mail):
// import webapplication.security.JwtUtil;
// import webapplication.security.CustomFilter;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
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

    // -------------------------------------------------------------------------
    // CRITICAL FIX: MOCK EXTERNAL DEPENDENCIES
    // If your main application loads filters or security beans, they need to be mocked
    // so Spring doesn't try to instantiate them (and fail) during the test.
    // -------------------------------------------------------------------------

    // Example: If you have a JWT filter, mock it:
    // @MockitoBean
    // private JwtUtil jwtUtil;

    // Example: If you have a security filter chain:
    // @MockitoBean
    // private CustomFilter customFilter;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole("DEVELOPER");
    }

    @Test
    void testCreateUser_Success() {
        User created = userService.createUser(testUser);

        assertNotNull(created.getId());
        assertEquals("Test User", created.getName());
        assertEquals("test@example.com", created.getEmail());
        assertEquals("DEVELOPER", created.getRole());
    }

    @Test
    void testGetAllUsers_Success() {
        userService.createUser(testUser);

        User secondUser = new User();
        secondUser.setName("Second User");
        secondUser.setEmail("second@example.com");
        secondUser.setRole("SCRUM_MASTER");
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
        assertThrows(RuntimeException.class, () -> {
            userService.getUserById(999L);
        });
    }

    @Test
    void testUpdateUser_Success() {
        User saved = userService.createUser(testUser);

        User updatedUser = new User();
        updatedUser.setName("Updated Name");
        updatedUser.setEmail("updated@example.com");
        updatedUser.setRole("PRODUCT_OWNER");

        User updated = userService.updateUser(saved.getId(), updatedUser);

        assertEquals("Updated Name", updated.getName());
        assertEquals("updated@example.com", updated.getEmail());
        assertEquals("PRODUCT_OWNER", updated.getRole());
    }

    @Test
    void testDeleteUser_Success() {
        User saved = userService.createUser(testUser);

        userService.deleteUser(saved.getId());

        assertThrows(RuntimeException.class, () -> {
            userService.getUserById(saved.getId());
        });
    }

    @Test
    void testFindUserByEmail_Success() {
        User saved = userService.createUser(testUser);

        User found = userRepository.findByEmail("test@example.com").orElse(null);

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("test@example.com", found.getEmail());
    }
}