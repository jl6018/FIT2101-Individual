import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.UserController;
import webapplication.dto.ResetPasswordRequest;
import webapplication.model.User;
import webapplication.service.EmailService;
import webapplication.service.UserService;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for UserController.
 * Tests creating, retrieving, and listing users, plus the password-reset
 * endpoints added for the "forgot password" flow.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@WebMvcTest(controllers = UserController.class)
@ContextConfiguration(classes = Application.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    /**
     * UserService depends on EmailService; provide a mock so the context
     * can start without an actual JavaMailSender bean.
     */
    @MockitoBean
    private EmailService emailService;

    // ===================== EXISTING USER CRUD =====================

    @Test
    void testCreateUser() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("John");
        user.setEmail("john@example.com");
        user.setPassword("password123");
        user.setRole("ADMIN");

        when(userService.createUser(any(User.class))).thenReturn(user);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John"))
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    void testGetUserById() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("John");

        when(userService.getUserById(anyLong())).thenReturn(user);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("John"));
    }

    @Test
    void testGetAllUsers() throws Exception {
        User user1 = new User(); user1.setId(1L); user1.setName("John");
        User user2 = new User(); user2.setId(2L); user2.setName("Jane");

        when(userService.getAllUsers()).thenReturn(Arrays.asList(user1, user2));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    // ===================== LOGIN =====================

    @Test
    void testLogin_Success() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("John");
        user.setEmail("john@example.com");
        user.setRole("EMPLOYEE");

        when(userService.login(anyString(), anyString())).thenReturn(user);

        String body = "{\"email\":\"john@example.com\",\"password\":\"password123\"}";

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.role").value("EMPLOYEE"));
    }

    @Test
    void testLogin_InvalidCredentials_Returns401() throws Exception {
        when(userService.login(anyString(), anyString())).thenReturn(null);

        String body = "{\"email\":\"john@example.com\",\"password\":\"wrong\"}";

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    // ===================== FORGOT PASSWORD =====================

    /**
     * The forgot-password endpoint always returns 200 with a neutral message,
     * whether or not the email is registered.
     */
    @Test
    void testForgotPassword_AlwaysReturns200() throws Exception {
        doNothing().when(userService).requestPasswordReset(anyString());

        String body = "{\"email\":\"john@example.com\"}";

        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    /**
     * Even if the email is unknown (service throws internally), the endpoint
     * must not leak that fact — it still returns 200.
     */
    @Test
    void testForgotPassword_UnknownEmail_StillReturns200() throws Exception {
        doThrow(new RuntimeException("Unknown"))
                .when(userService).requestPasswordReset(anyString());

        String body = "{\"email\":\"nobody@example.com\"}";

        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    // ===================== RESET PASSWORD =====================

    @Test
    void testResetPassword_Success_Returns200() throws Exception {
        doNothing().when(userService).resetPassword(anyString(), anyString());

        String body = "{\"token\":\"abc123\",\"newPassword\":\"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void testResetPassword_WeakPassword_Returns400() throws Exception {
        doThrow(new IllegalArgumentException("Password must be at least 8 characters"))
                .when(userService).resetPassword(anyString(), anyString());

        String body = "{\"token\":\"abc123\",\"newPassword\":\"short\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testResetPassword_InvalidToken_Returns404() throws Exception {
        doThrow(new RuntimeException("Invalid or expired reset link"))
                .when(userService).resetPassword(anyString(), anyString());

        String body = "{\"token\":\"bad\",\"newPassword\":\"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    // ===================== RESET PASSWORD DIRECT (demo flow) =====================

    @Test
    void testResetPasswordDirect_Success_Returns200() throws Exception {
        doNothing().when(userService).resetPasswordByEmail(anyString(), anyString());

        String body = "{\"email\":\"john@example.com\",\"newPassword\":\"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password-direct")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void testResetPasswordDirect_UnknownEmail_Returns404() throws Exception {
        doThrow(new RuntimeException("No account found with that email"))
                .when(userService).resetPasswordByEmail(anyString(), anyString());

        String body = "{\"email\":\"nobody@example.com\",\"newPassword\":\"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password-direct")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    void testResetPasswordDirect_WeakPassword_Returns400() throws Exception {
        doThrow(new IllegalArgumentException("Password must be at least 8 characters"))
                .when(userService).resetPasswordByEmail(anyString(), anyString());

        String body = "{\"email\":\"john@example.com\",\"newPassword\":\"short\"}";

        mockMvc.perform(post("/api/users/reset-password-direct")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ===================== VALIDATE TOKEN =====================

    @Test
    void testValidateResetToken_Valid_Returns200() throws Exception {
        when(userService.isResetTokenValid("good")).thenReturn(true);

        mockMvc.perform(get("/api/users/reset-password/validate").param("token", "good"))
                .andExpect(status().isOk());
    }

    @Test
    void testValidateResetToken_Invalid_Returns404() throws Exception {
        when(userService.isResetTokenValid("bad")).thenReturn(false);

        mockMvc.perform(get("/api/users/reset-password/validate").param("token", "bad"))
                .andExpect(status().isNotFound());
    }
}