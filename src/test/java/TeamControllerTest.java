import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.TeamController;
import webapplication.model.Team;
import webapplication.service.TeamService;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = TeamController.class)
@ContextConfiguration(classes = Application.class)
class TeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TeamService teamService;

    @Test
    void testCreateTeam() throws Exception {
        Team team = new Team();
        team.setId(1L);
        team.setName("Alpha");

        when(teamService.createTeam(any(Team.class))).thenReturn(team);

        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(team)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alpha"));
    }

    @Test
    void testGetTeamById() throws Exception {
        Team team = new Team();
        team.setId(1L);
        team.setName("Alpha");

        when(teamService.getTeamById(anyLong())).thenReturn(team);

        mockMvc.perform(get("/api/teams/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Alpha"));
    }

    @Test
    void testGetAllTeams() throws Exception {
        Team t1 = new Team(); t1.setId(1L); t1.setName("Alpha");
        Team t2 = new Team(); t2.setId(2L); t2.setName("Beta");

        when(teamService.getAllTeams()).thenReturn(Arrays.asList(t1, t2));

        mockMvc.perform(get("/api/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}