import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import webapplication.Application;
import webapplication.model.Project;
import webapplication.model.Sprint;
import webapplication.model.SprintStatus;
import webapplication.repository.ProjectRepository;
import webapplication.repository.SprintRepository;
import webapplication.service.SprintService;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SprintService.
 * Tests sprint creation, status transitions, retrieval, and deletion.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:sprintdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class SprintServiceTest {

    @Autowired
    private SprintService sprintService;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private Project testProject;
    private Sprint testSprint;

    /**
     * Sets up fresh test data before each test.
     */
    @BeforeEach
    void setUp() {
        sprintRepository.deleteAll();
        projectRepository.deleteAll();

        testProject = new Project();
        testProject.setName("Test Project");
        testProject = projectRepository.save(testProject);

        testSprint = new Sprint();
        testSprint.setName("Sprint 1");
        testSprint.setStartDate(LocalDate.now());
        testSprint.setEndDate(LocalDate.now().plusDays(14));
        testSprint.setStatus(null);
        testSprint.setProject(testProject);
    }

    /**
     * Tests that creating a sprint saves it with a PLANNED status.
     */
    @Test
    void testCreateSprint_Success() {
        Sprint created = sprintService.createSprint(testSprint);

        assertNotNull(created.getId());
        assertEquals("Sprint 1", created.getName());
        assertEquals(testProject.getId(), created.getProject().getId());
        assertEquals(SprintStatus.PLANNED, created.getStatus());
    }

    /**
     * Tests that starting a sprint transitions its status to ACTIVE.
     */
    @Test
    void testStartSprint_Success() {
        Sprint saved = sprintService.createSprint(testSprint);

        Sprint started = sprintService.startSprint(saved.getId());

        assertEquals(SprintStatus.ACTIVE, started.getStatus());
    }

    /**
     * Tests that completing a sprint transitions its status to COMPLETED.
     */
    @Test
    void testCompleteSprint_Success() {
        Sprint saved = sprintService.createSprint(testSprint);
        sprintService.startSprint(saved.getId());

        Sprint completed = sprintService.completeSprint(saved.getId());

        assertEquals(SprintStatus.COMPLETED, completed.getStatus());
    }

    /**
     * Tests that retrieving all sprints returns the correct count.
     */
    @Test
    void testGetAllSprints_Success() {
        sprintService.createSprint(testSprint);

        Sprint secondSprint = new Sprint();
        secondSprint.setName("Sprint 2");
        secondSprint.setProject(testProject);
        sprintService.createSprint(secondSprint);

        List<Sprint> sprints = sprintService.getAllSprints();

        assertNotNull(sprints);
        assertEquals(2, sprints.size());
    }

    /**
     * Tests that retrieving a sprint by ID returns the correct sprint.
     */
    @Test
    void testGetSprintById_Success() {
        Sprint saved = sprintService.createSprint(testSprint);

        Sprint found = sprintService.getSprintById(saved.getId());

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("Sprint 1", found.getName());
    }

    /**
     * Tests that retrieving a non-existent sprint throws an exception.
     */
    @Test
    void testGetSprintById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> {
            sprintService.getSprintById(999L);
        });
    }

    /**
     * Tests that deleting a sprint removes it from the database.
     */
    @Test
    void testDeleteSprint_Success() {
        Sprint saved = sprintService.createSprint(testSprint);

        sprintService.deleteSprint(saved.getId());

        assertThrows(RuntimeException.class, () -> {
            sprintService.getSprintById(saved.getId());
        });
    }
}