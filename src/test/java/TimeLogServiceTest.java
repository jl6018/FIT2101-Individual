import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import webapplication.Application;
import webapplication.model.*;
import webapplication.repository.*;
import webapplication.service.TimeLogService;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:timelogdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TimeLogServiceTest {

    @Autowired
    private TimeLogService timeLogService;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TeamRepository teamRepository;

    private User testUser;
    private Task testTask;

    @BeforeEach
    void setUp() {
        timeLogRepository.deleteAll();
        taskRepository.deleteAll();
        sprintRepository.deleteAll();
        projectRepository.deleteAll();
        teamRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Developer");
        testUser.setEmail("dev@example.com");
        testUser.setRole("DEVELOPER");
        testUser = userRepository.save(testUser);

        Task task = new Task();
        task.setName("Sprint 3 Task");
        task.setProgress(0);
        task.setAssignedUser(testUser);
        testTask = taskRepository.save(task);
    }

    @Test
    void testLogHours() {
        TimeLog log = new TimeLog(LocalDate.now(), 8.0, "Worked on API", testTask, testUser);

        TimeLog saved = timeLogService.logHours(log);

        assertNotNull(saved.getId());
        assertEquals(8.0, saved.getHours());
    }

    @Test
    void testGetTotalHoursForUserInRange() {
        timeLogService.logHours(new TimeLog(LocalDate.now().minusDays(1), 4.0, "Work", testTask, testUser));
        timeLogService.logHours(new TimeLog(LocalDate.now(), 6.0, "Work", testTask, testUser));

        double total = timeLogService.getTotalHoursForUserInRange(testUser.getId(), LocalDate.now().minusDays(2), LocalDate.now());

        assertEquals(10.0, total);
    }
}