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
        testSprint.setStatus(null); // Status will be set to PLANNED by the service
        testSprint.setProject(testProject);
    }

    @Test
    void testCreateSprint_Success() {
        Sprint created = sprintService.createSprint(testSprint);

        assertNotNull(created.getId());
        assertEquals("Sprint 1", created.getName());
        assertEquals(testProject.getId(), created.getProject().getId());
        // The service forces the status to PLANNED
        assertEquals(SprintStatus.PLANNED, created.getStatus());
    }

    @Test
    void testStartSprint_Success() {
        Sprint saved = sprintService.createSprint(testSprint);

        Sprint started = sprintService.startSprint(saved.getId());

        assertEquals(SprintStatus.ACTIVE, started.getStatus());
    }

    @Test
    void testCompleteSprint_Success() {
        Sprint saved = sprintService.createSprint(testSprint);
        sprintService.startSprint(saved.getId()); // Start it first

        Sprint completed = sprintService.completeSprint(saved.getId());

        assertEquals(SprintStatus.COMPLETED, completed.getStatus());
    }

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

    @Test
    void testGetSprintById_Success() {
        Sprint saved = sprintService.createSprint(testSprint);

        Sprint found = sprintService.getSprintById(saved.getId());

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("Sprint 1", found.getName());
    }

    @Test
    void testGetSprintById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> {
            sprintService.getSprintById(999L);
        });
    }

    @Test
    void testDeleteSprint_Success() {
        Sprint saved = sprintService.createSprint(testSprint);

        sprintService.deleteSprint(saved.getId());

        assertThrows(RuntimeException.class, () -> {
            sprintService.getSprintById(saved.getId());
        });
    }
}