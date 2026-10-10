import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import webapplication.Application;
import webapplication.dto.TaskHoursSummary;
import webapplication.dto.TimeLogSummary;
import webapplication.model.*;
import webapplication.repository.*;
import webapplication.service.TimeLogService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TimeLogService.
 * Tests logging hours, total hours in a range, per-sprint totals (US25),
 * per-member summaries (US26/27), member-specific ranges (US28),
 * and hours-per-task (US29).
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
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
    private Sprint testSprint;

    /**
     * Sets up fresh test data before each test.
     */
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
        testUser.setPassword("password123");
        testUser.setRole("EMPLOYEE");
        testUser = userRepository.save(testUser);

        testSprint = new Sprint();
        testSprint.setName("Sprint 1");
        testSprint = sprintRepository.save(testSprint);

        Task task = new Task();
        task.setName("Sprint 3 Task");
        task.setProgress(0);
        task.setSprint(testSprint);
        task.setAssignedUser(testUser);
        testTask = taskRepository.save(task);
    }

    /**
     * Tests that logging hours saves the entry with an assigned ID.
     */
    @Test
    void testLogHours() {
        TimeLog log = new TimeLog(LocalDate.now(), LocalTime.of(9, 0), 8.0,
                "Worked on API", testTask, testUser);

        TimeLog saved = timeLogService.logHours(log);

        assertNotNull(saved.getId());
        assertEquals(8.0, saved.getHours());
    }

    /**
     * Tests the new DTO-based logHours used by the frontend (US24).
     */
    @Test
    void testLogHoursFromDto_Success() {
        TimeLog saved = timeLogService.logHours(
                LocalDate.now().toString(),
                "09:30",
                2.5,
                "Frontend work",
                testTask.getId(),
                testUser.getId()
        );

        assertNotNull(saved.getId());
        assertEquals(2.5, saved.getHours());
        assertEquals(LocalTime.of(9, 30), saved.getStartTime());
        assertEquals(testTask.getId(), saved.getTask().getId());
        assertEquals(testUser.getId(), saved.getUser().getId());
    }

    /**
     * Tests that logHours rejects non-positive hours.
     */
    @Test
    void testLogHoursFromDto_ZeroHours_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                timeLogService.logHours(
                        LocalDate.now().toString(),
                        "09:30",
                        0.0,
                        "no work",
                        testTask.getId(),
                        testUser.getId()));
    }

    /**
     * Tests that calculating total hours for a user in a date range sums correctly.
     */
    @Test
    void testGetTotalHoursForUserInRange() {
        timeLogService.logHours(new TimeLog(LocalDate.now().minusDays(1), LocalTime.of(9, 0),
                4.0, "Work", testTask, testUser));
        timeLogService.logHours(new TimeLog(LocalDate.now(), LocalTime.of(9, 0),
                6.0, "Work", testTask, testUser));

        double total = timeLogService.getTotalHoursForUserInRange(
                testUser.getId(), LocalDate.now().minusDays(2), LocalDate.now());

        assertEquals(10.0, total);
    }

    /**
     * US25: total hours for a sprint sums across every task in that sprint.
     */
    @Test
    void testGetTotalHoursForSprint() {
        timeLogService.logHours(new TimeLog(LocalDate.now(), LocalTime.of(9, 0),
                3.0, "Work", testTask, testUser));
        timeLogService.logHours(new TimeLog(LocalDate.now(), LocalTime.of(13, 0),
                2.0, "More work", testTask, testUser));

        double total = timeLogService.getTotalHoursForSprint(testSprint.getId());

        assertEquals(5.0, total);
    }

    /**
     * US26 / US27: summary returns one row per employee with correct totals.
     */
    @Test
    void testGetSummaryByRange_Success() {
        timeLogService.logHours(new TimeLog(LocalDate.now(), LocalTime.of(9, 0),
                4.0, "Work", testTask, testUser));
        timeLogService.logHours(new TimeLog(LocalDate.now().minusDays(1), LocalTime.of(9, 0),
                3.0, "Work", testTask, testUser));

        List<TimeLogSummary> rows = timeLogService.getSummaryByRange(
                LocalDate.now().minusDays(7), LocalDate.now());

        assertEquals(1, rows.size());
        TimeLogSummary row = rows.get(0);
        assertEquals(testUser.getId(), row.getUserId());
        assertEquals(7.0, row.getTotalHours());
        assertEquals(2, row.getDaysWorked());
        assertEquals(3.5, row.getAvgPerDay());
    }

    /**
     * US28: logs for a specific user within a range are returned sorted desc.
     */
    @Test
    void testGetLogsForUserInRange_Success() {
        timeLogService.logHours(new TimeLog(LocalDate.now().minusDays(1), LocalTime.of(9, 0),
                4.0, "Work", testTask, testUser));
        timeLogService.logHours(new TimeLog(LocalDate.now(), LocalTime.of(9, 0),
                6.0, "Work", testTask, testUser));

        List<TimeLog> logs = timeLogService.getLogsForUserInRange(
                testUser.getId(), LocalDate.now().minusDays(7), LocalDate.now());

        assertEquals(2, logs.size());
        assertEquals(LocalDate.now(), logs.get(0).getDate());  // newest first
    }

    /**
     * US29: hours per task groups logs by task and sorts desc.
     */
    @Test
    void testGetHoursPerTask_Success() {
        Task secondTask = new Task();
        secondTask.setName("Second Task");
        secondTask.setProgress(0);
        secondTask.setSprint(testSprint);
        secondTask.setAssignedUser(testUser);
        secondTask = taskRepository.save(secondTask);

        timeLogService.logHours(new TimeLog(LocalDate.now(), LocalTime.of(9, 0),
                5.0, "Work", testTask, testUser));
        timeLogService.logHours(new TimeLog(LocalDate.now(), LocalTime.of(9, 0),
                2.0, "Work", secondTask, testUser));

        List<TaskHoursSummary> rows = timeLogService.getHoursPerTask(
                LocalDate.now().minusDays(7), LocalDate.now());

        assertEquals(2, rows.size());
        assertEquals(testTask.getName(), rows.get(0).getTaskName());
        assertEquals(5.0, rows.get(0).getTotalHours());
        assertEquals(2.0, rows.get(1).getTotalHours());
    }
}