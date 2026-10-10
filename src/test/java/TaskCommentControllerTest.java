import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.TaskCommentController;
import webapplication.dto.TaskCommentResponse;
import webapplication.service.TaskCommentService;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for TaskCommentController (US12).
 * Tests listing, adding, deleting, and fetching recent comments.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@WebMvcTest(controllers = TaskCommentController.class)
@ContextConfiguration(classes = Application.class)
class TaskCommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskCommentService commentService;

    /**
     * US12: GET /api/tasks/{id}/comments returns the list of comments.
     */
    @Test
    void testGetComments() throws Exception {
        TaskCommentResponse c = new TaskCommentResponse(
                1L, "Looks good", LocalDateTime.now(),
                1L, "John", "EMPLOYEE", 1L, "Implement API");

        when(commentService.getCommentsByTask(anyLong()))
                .thenReturn(Collections.singletonList(c));

        mockMvc.perform(get("/api/tasks/1/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].body").value("Looks good"));
    }

    /**
     * US12: POST /api/tasks/{id}/comments saves a comment and returns it.
     */
    @Test
    void testAddComment() throws Exception {
        TaskCommentResponse saved = new TaskCommentResponse(
                1L, "Nice work", LocalDateTime.now(),
                1L, "John", "EMPLOYEE", 1L, "Implement API");

        when(commentService.addComment(anyLong(), anyLong(), anyString()))
                .thenReturn(saved);

        String body = "{\"authorId\":1,\"body\":\"Nice work\"}";

        mockMvc.perform(post("/api/tasks/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("Nice work"));
    }

    /**
     * US12: adding a comment without an authorId returns 400.
     */
    @Test
    void testAddComment_MissingAuthor_Returns400() throws Exception {
        String body = "{\"body\":\"No author\"}";

        mockMvc.perform(post("/api/tasks/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    /**
     * US12: adding a blank comment returns 400.
     */
    @Test
    void testAddComment_BlankBody_Returns400() throws Exception {
        when(commentService.addComment(anyLong(), anyLong(), anyString()))
                .thenThrow(new IllegalArgumentException("Comment body is required"));

        String body = "{\"authorId\":1,\"body\":\"\"}";

        mockMvc.perform(post("/api/tasks/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    /**
     * US12: GET /api/tasks/comments/recent returns recent comments.
     */
    @Test
    void testGetRecentComments() throws Exception {
        TaskCommentResponse c = new TaskCommentResponse(
                1L, "Recent message", LocalDateTime.now(),
                1L, "John", "EMPLOYEE", 1L, "Implement API");

        when(commentService.getRecentComments(anyInt()))
                .thenReturn(Collections.singletonList(c));

        mockMvc.perform(get("/api/tasks/comments/recent").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * US12: DELETE with an allowed role returns 204 No Content.
     */
    @Test
    void testDeleteComment_AllowedRole_Returns204() throws Exception {
        mockMvc.perform(delete("/api/tasks/1/comments/1")
                        .header("X-Role", "ADMIN"))
                .andExpect(status().isNoContent());
    }

    /**
     * US12: DELETE without a permitted role returns 403 Forbidden.
     */
    @Test
    void testDeleteComment_ForbiddenRole_Returns403() throws Exception {
        mockMvc.perform(delete("/api/tasks/1/comments/1")
                        .header("X-Role", "GUEST"))
                .andExpect(status().isForbidden());
    }
}