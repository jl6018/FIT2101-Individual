import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.ProjectController;
import webapplication.model.Project;
import webapplication.service.ProjectService;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ProjectController.class)
@ContextConfiguration(classes = Application.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProjectService projectService;

    @Test
    void testCreateProject() throws Exception {
        Project project = new Project();
        project.setId(1L);
        project.setName("Symph");

        when(projectService.createProject(any(Project.class))).thenReturn(project);

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(project)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Symph"));
    }

    @Test
    void testGetProjectById() throws Exception {
        Project project = new Project();
        project.setId(1L);
        project.setName("Symph");

        when(projectService.getProjectById(anyLong())).thenReturn(project);

        mockMvc.perform(get("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void testGetAllProjects() throws Exception {
        Project p1 = new Project(); p1.setId(1L); p1.setName("Symph");
        Project p2 = new Project(); p2.setId(2L); p2.setName("Tasker");

        when(projectService.getAllProjects()).thenReturn(Arrays.asList(p1, p2));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}