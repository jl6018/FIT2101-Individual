import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.TagController;
import webapplication.model.Tag;
import webapplication.model.Task;
import webapplication.service.TagService;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for TagController (US13 / US14).
 * Tests listing tags, adding a tag to a task, and removing a tag from a task.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@WebMvcTest(controllers = TagController.class)
@ContextConfiguration(classes = Application.class)
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TagService tagService;

    /**
     * Tests that GET /api/tags returns the correct count.
     */
    @Test
    void testGetAllTags() throws Exception {
        Tag t1 = new Tag("frontend");
        t1.setId(1L);
        Tag t2 = new Tag("backend");
        t2.setId(2L);

        when(tagService.getAllTags()).thenReturn(Arrays.asList(t1, t2));

        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    /**
     * US13: adding a tag to a task returns 200 OK with the updated task.
     */
    @Test
    void testAddTagToTask() throws Exception {
        Task updated = new Task();
        updated.setId(1L);
        updated.setName("Implement API");

        when(tagService.addTagToTask(anyLong(), anyString())).thenReturn(updated);

        String body = "{\"name\":\"frontend\"}";

        mockMvc.perform(post("/api/tags/task/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    /**
     * US13: adding a tag with a blank name returns 400 Bad Request.
     */
    @Test
    void testAddTagToTask_BlankName_Returns400() throws Exception {
        when(tagService.addTagToTask(anyLong(), anyString()))
                .thenThrow(new IllegalArgumentException("Tag name is required"));

        String body = "{\"name\":\"\"}";

        mockMvc.perform(post("/api/tags/task/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    /**
     * US13: removing a tag from a task returns 200 OK with the updated task.
     */
    @Test
    void testRemoveTagFromTask() throws Exception {
        Task updated = new Task();
        updated.setId(1L);
        updated.setName("Implement API");

        when(tagService.removeTagFromTask(anyLong(), anyLong())).thenReturn(updated);

        mockMvc.perform(delete("/api/tags/task/1/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    /**
     * US13: removing a tag from a missing task returns 400 Bad Request.
     */
    @Test
    void testRemoveTagFromTask_NotFound_Returns400() throws Exception {
        when(tagService.removeTagFromTask(anyLong(), anyLong()))
                .thenThrow(new RuntimeException("Task not found"));

        mockMvc.perform(delete("/api/tags/task/999/1"))
                .andExpect(status().isBadRequest());
    }
}