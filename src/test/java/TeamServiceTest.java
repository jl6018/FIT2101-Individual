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

/**
 * Unit tests for TeamService.
 * Tests team creation, retrieval, update, and deletion.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
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

    /**
     * Sets up fresh test data before each test.
     */
    @BeforeEach
    void setUp() {
        teamRepository.deleteAll();
        testTeam = new Team();
        testTeam.setName("Team Alpha");
    }

    /**
     * Tests that creating a team saves it with the correct name.
     */
    @Test
    void testCreateTeam_Success() {
        Team created = teamService.createTeam(testTeam);
        assertNotNull(created.getId());
        assertEquals("Team Alpha", created.getName());
    }

    /**
     * Tests that retrieving all teams returns the correct count.
     */
    @Test
    void testGetAllTeams_Success() {
        teamService.createTeam(testTeam);
        Team second = new Team();
        second.setName("Team Beta");
        teamService.createTeam(second);

        List<Team> teams = teamService.getAllTeams();
        assertEquals(2, teams.size());
    }

    /**
     * Tests that retrieving a team by ID returns the correct team.
     */
    @Test
    void testGetTeamById_Success() {
        Team saved = teamService.createTeam(testTeam);
        Team found = teamService.getTeamById(saved.getId());
        assertEquals(saved.getId(), found.getId());
    }

    /**
     * Tests that retrieving a non-existent team throws an exception.
     */
    @Test
    void testGetTeamById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> teamService.getTeamById(999L));
    }

    /**
     * Tests that updating a team saves the new name.
     */
    @Test
    void testUpdateTeam_Success() {
        Team saved = teamService.createTeam(testTeam);
        saved.setName("Updated Team");
        Team updated = teamService.updateTeam(saved.getId(), saved);
        assertEquals("Updated Team", updated.getName());
    }

    /**
     * Tests that deleting a team removes it from the database.
     */
    @Test
    void testDeleteTeam_Success() {
        Team saved = teamService.createTeam(testTeam);
        teamService.deleteTeam(saved.getId());
        assertThrows(RuntimeException.class, () -> teamService.getTeamById(saved.getId()));
    }
}