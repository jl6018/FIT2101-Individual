import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import webapplication.Application;
import webapplication.model.Project;
import webapplication.model.Team;
import webapplication.model.User;
import webapplication.repository.ProjectRepository;
import webapplication.repository.TeamRepository;
import webapplication.repository.UserRepository;
import webapplication.service.ProjectService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ProjectService.
 * Tests project creation, retrieval, update, and deletion.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:projectdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ProjectServiceTest {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    private User testUser;
    private Team testTeam;
    private Project testProject;

    /**
     * Sets up fresh test data before each test.
     */
    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        teamRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Project Owner");
        testUser.setEmail("owner@example.com");
        testUser.setPassword("password123");
        testUser.setRole("ADMIN");
        testUser = userRepository.save(testUser);

        testTeam = new Team();
        testTeam.setName("Team Alpha");
        testTeam = teamRepository.save(testTeam);

        testProject = new Project();
        testProject.setName("Symph Development");
        testProject.setDescription("Project management tool");
        testProject.setTeam(testTeam);
    }

    /**
     * Tests that creating a project saves it with the correct details.
     */
    @Test
    void testCreateProject_Success() {
        Project created = projectService.createProject(testProject);

        assertNotNull(created.getId());
        assertEquals("Symph Development", created.getName());
        assertEquals("Project management tool", created.getDescription());
        assertEquals(testTeam.getId(), created.getTeam().getId());
    }

    /**
     * Tests that retrieving all projects returns the correct count.
     */
    @Test
    void testGetAllProjects_Success() {
        projectService.createProject(testProject);

        Project secondProject = new Project();
        secondProject.setName("Second Project");
        secondProject.setDescription("Another project");
        secondProject.setTeam(testTeam);
        projectService.createProject(secondProject);

        List<Project> projects = projectService.getAllProjects();

        assertNotNull(projects);
        assertEquals(2, projects.size());
    }

    /**
     * Tests that retrieving a project by ID returns the correct project.
     */
    @Test
    void testGetProjectById_Success() {
        Project saved = projectService.createProject(testProject);

        Project found = projectService.getProjectById(saved.getId());

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("Symph Development", found.getName());
    }

    /**
     * Tests that retrieving a non-existent project throws an exception.
     */
    @Test
    void testGetProjectById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> {
            projectService.getProjectById(999L);
        });
    }

    /**
     * Tests that updating a project saves the new name and description.
     */
    @Test
    void testUpdateProject_Success() {
        Project saved = projectService.createProject(testProject);

        Project updatedProject = new Project();
        updatedProject.setName("Updated Project Name");
        updatedProject.setDescription("Updated description");
        updatedProject.setTeam(testTeam);

        Project updated = projectService.updateProject(saved.getId(), updatedProject);

        assertEquals("Updated Project Name", updated.getName());
        assertEquals("Updated description", updated.getDescription());
    }

    /**
     * Tests that deleting a project removes it from the database.
     */
    @Test
    void testDeleteProject_Success() {
        Project saved = projectService.createProject(testProject);

        projectService.deleteProject(saved.getId());

        assertThrows(RuntimeException.class, () -> {
            projectService.getProjectById(saved.getId());
        });
    }

    /**
     * Tests that creating a project without a team saves successfully with a null team.
     */
    @Test
    void testCreateProject_WithoutTeam_Success() {
        Project noTeamProject = new Project();
        noTeamProject.setName("No Team Project");
        noTeamProject.setDescription("Project without a team");
        noTeamProject.setTeam(null);

        Project created = projectService.createProject(noTeamProject);

        assertNotNull(created.getId());
        assertNull(created.getTeam());
    }
}