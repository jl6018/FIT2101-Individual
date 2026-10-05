import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.SprintController;
import webapplication.model.Sprint;
import webapplication.service.SprintService;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for SprintController.
 * Tests creating, retrieving, and listing sprints.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@WebMvcTest(controllers = SprintController.class)
@ContextConfiguration(classes = Application.class)
class SprintControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SprintService sprintService;

    /**
     * Tests that creating a sprint returns 200 OK with the correct name.
     */
    @Test
    void testCreateSprint() throws Exception {
        Sprint sprint = new Sprint();
        sprint.setId(1L);
        sprint.setName("Sprint 1");

        when(sprintService.createSprint(any(Sprint.class))).thenReturn(sprint);

        mockMvc.perform(post("/api/sprints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sprint)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sprint 1"));
    }

    /**
     * Tests that retrieving a sprint by ID returns 200 OK with the correct ID.
     */
    @Test
    void testGetSprintById() throws Exception {
        Sprint sprint = new Sprint();
        sprint.setId(1L);
        sprint.setName("Sprint 1");

        when(sprintService.getSprintById(anyLong())).thenReturn(sprint);

        mockMvc.perform(get("/api/sprints/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    /**
     * Tests that retrieving all sprints returns the correct count.
     */
    @Test
    void testGetAllSprints() throws Exception {
        Sprint s1 = new Sprint(); s1.setId(1L); s1.setName("Sprint 1");
        Sprint s2 = new Sprint(); s2.setId(2L); s2.setName("Sprint 2");

        when(sprintService.getAllSprints()).thenReturn(Arrays.asList(s1, s2));

        mockMvc.perform(get("/api/sprints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}