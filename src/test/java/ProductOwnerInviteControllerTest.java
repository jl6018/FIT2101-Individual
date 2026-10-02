import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.ProductOwnerInviteController;
import webapplication.model.ProductOwnerInvite;
import webapplication.service.ProductOwnerInviteService;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ProductOwnerInviteController.
 * Tests sending invite, invalid email, and retrieving invites.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@WebMvcTest(controllers = ProductOwnerInviteController.class)
@ContextConfiguration(classes = Application.class)
class ProductOwnerInviteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProductOwnerInviteService inviteService;

    /**
     * Tests sending an invite with a valid email returns 200 OK.
     */
    @Test
    void testInviteProductOwner_ValidEmail_ReturnsOk() throws Exception {
        ProductOwnerInvite invite = new ProductOwnerInvite();
        invite.setId(1L);
        invite.setEmail("owner@example.com");

        when(inviteService.inviteProductOwner(any(ProductOwnerInvite.class))).thenReturn(invite);

        mockMvc.perform(post("/api/invites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invite)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("owner@example.com"));
    }

    /**
     * Tests sending an invite with an invalid email returns 400 Bad Request.
     */
    @Test
    void testInviteProductOwner_InvalidEmail_Returns400() throws Exception {
        when(inviteService.inviteProductOwner(any(ProductOwnerInvite.class)))
                .thenThrow(new IllegalArgumentException("Invalid email"));

        String body = "{\"email\":\"notanemail\"}";

        mockMvc.perform(post("/api/invites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    /**
     * Tests sending an invite with an empty email returns 400 Bad Request.
     */
    @Test
    void testInviteProductOwner_EmptyEmail_Returns400() throws Exception {
        when(inviteService.inviteProductOwner(any(ProductOwnerInvite.class)))
                .thenThrow(new IllegalArgumentException("Email is required"));

        String body = "{\"email\":\"\"}";

        mockMvc.perform(post("/api/invites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    /**
     * Tests retrieving all invites returns the correct count.
     */
    @Test
    void testGetAllInvites_ReturnsOk() throws Exception {
        ProductOwnerInvite i1 = new ProductOwnerInvite();
        i1.setId(1L);
        i1.setEmail("owner1@example.com");

        ProductOwnerInvite i2 = new ProductOwnerInvite();
        i2.setId(2L);
        i2.setEmail("owner2@example.com");

        when(inviteService.getAllInvites()).thenReturn(Arrays.asList(i1, i2));

        mockMvc.perform(get("/api/invites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    /**
     * Tests retrieving an invite by ID returns 200 OK with the correct email.
     */
    @Test
    void testGetInviteById_ReturnsOk() throws Exception {
        ProductOwnerInvite invite = new ProductOwnerInvite();
        invite.setId(1L);
        invite.setEmail("owner@example.com");

        when(inviteService.getInviteById(1L)).thenReturn(invite);

        mockMvc.perform(get("/api/invites/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("owner@example.com"));
    }
}