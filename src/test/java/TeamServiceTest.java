import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import webapplication.Application;
import webapplication.model.Team;
import webapplication.repository.TeamRepository;
import webapplication.service.TeamService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:teamdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TeamServiceTest {

    @Autowired
    private TeamService teamService;

    @Autowired
    private TeamRepository teamRepository;

    private Team testTeam;

    @BeforeEach
    void setUp() {
        teamRepository.deleteAll();
        testTeam = new Team();
        testTeam.setName("Team Alpha");
    }

    @Test
    void testCreateTeam_Success() {
        Team created = teamService.createTeam(testTeam);
        assertNotNull(created.getId());
        assertEquals("Team Alpha", created.getName());
    }

    @Test
    void testGetAllTeams_Success() {
        teamService.createTeam(testTeam);
        Team second = new Team();
        second.setName("Team Beta");
        teamService.createTeam(second);

        List<Team> teams = teamService.getAllTeams();
        assertEquals(2, teams.size());
    }

    @Test
    void testGetTeamById_Success() {
        Team saved = teamService.createTeam(testTeam);
        Team found = teamService.getTeamById(saved.getId());
        assertEquals(saved.getId(), found.getId());
    }

    @Test
    void testGetTeamById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> teamService.getTeamById(999L));
    }

    @Test
    void testUpdateTeam_Success() {
        Team saved = teamService.createTeam(testTeam);
        saved.setName("Updated Team");
        Team updated = teamService.updateTeam(saved.getId(), saved);
        assertEquals("Updated Team", updated.getName());
    }

    @Test
    void testDeleteTeam_Success() {
        Team saved = teamService.createTeam(testTeam);
        teamService.deleteTeam(saved.getId());
        assertThrows(RuntimeException.class, () -> teamService.getTeamById(saved.getId()));
    }
}