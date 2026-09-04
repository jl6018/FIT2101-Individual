import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import webapplication.Application;  // ⬅️ ADD THIS IMPORT
import webapplication.model.*;
import webapplication.repository.*;
import webapplication.service.TaskService;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = Application.class)  // ⬅️ ADD THIS
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TaskServiceTest {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private TeamRepository teamRepository;

    private User testUser;
    private Project testProject;
    private Sprint testSprint;
    private Task testTask;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
        sprintRepository.deleteAll();
        projectRepository.deleteAll();
        teamRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Task Assignee");
        testUser.setEmail("assignee@example.com");
        testUser.setRole("DEVELOPER");
        testUser = userRepository.save(testUser);

        Team testTeam = new Team();
        testTeam.setName("Team Alpha");
        testTeam = teamRepository.save(testTeam);

        testProject = new Project();
        testProject.setName("Symph Development");
        testProject.setDescription("Project management tool");
        testProject.setTeam(testTeam);
        testProject = projectRepository.save(testProject);

        testSprint = new Sprint();
        testSprint.setName("Sprint 1");
        testSprint.setProject(testProject);
        testSprint = sprintRepository.save(testSprint);

        testTask = new Task();
        testTask.setName("Implement User Registration");
        testTask.setDescription("Create registration endpoint");
        testTask.setStatus(TaskStatus.PRODUCT_BACKLOG);
        testTask.setPriority(Priority.HIGH);
        testTask.setProgress(0);
        testTask.setDueDate(LocalDate.now().plusDays(7));
        testTask.setSprint(testSprint);
        testTask.setAssignedUser(testUser);
    }

    @Test
    void testCreateTask_Success() {
        Task created = taskService.createTask(testTask);

        assertNotNull(created.getId());
        assertEquals("Implement User Registration", created.getName());
        assertEquals(TaskStatus.PRODUCT_BACKLOG, created.getStatus());
        assertEquals(Priority.HIGH, created.getPriority());
        assertEquals(0, created.getProgress());
        assertEquals(testSprint.getId(), created.getSprint().getId());
        assertEquals(testUser.getId(), created.getAssignedUser().getId());
    }

    @Test
    void testCreateTask_NullStatus_SetsDefault() {
        Task task = new Task();
        task.setName("Test Task");
        task.setDescription("Test description");
        task.setStatus(null);
        task.setPriority(Priority.MEDIUM);
        task.setProgress(0);
        task.setSprint(testSprint);
        task.setAssignedUser(testUser);

        Task created = taskService.createTask(task);

        assertEquals(TaskStatus.PRODUCT_BACKLOG, created.getStatus());
    }

    @Test
    void testCreateTask_NegativeProgress_SetsToZero() {
        Task task = new Task();
        task.setName("Test Task");
        task.setDescription("Test description");
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setPriority(Priority.MEDIUM);
        task.setProgress(-10);
        task.setSprint(testSprint);
        task.setAssignedUser(testUser);

        Task created = taskService.createTask(task);

        assertEquals(0, created.getProgress());
    }

    @Test
    void testCreateTask_ProgressOver100_SetsTo100() {
        Task task = new Task();
        task.setName("Test Task");
        task.setDescription("Test description");
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setPriority(Priority.MEDIUM);
        task.setProgress(150);
        task.setSprint(testSprint);
        task.setAssignedUser(testUser);

        Task created = taskService.createTask(task);

        assertEquals(100, created.getProgress());
    }

    @Test
    void testGetAllTasks_Success() {
        taskService.createTask(testTask);

        Task secondTask = new Task();
        secondTask.setName("Implement Login");
        secondTask.setDescription("Create login endpoint");
        secondTask.setStatus(TaskStatus.PRODUCT_BACKLOG);
        secondTask.setPriority(Priority.MEDIUM);
        secondTask.setProgress(0);
        secondTask.setSprint(testSprint);
        secondTask.setAssignedUser(testUser);
        taskService.createTask(secondTask);

        List<Task> tasks = taskService.getAllTasks();

        assertNotNull(tasks);
        assertEquals(2, tasks.size());
    }

    @Test
    void testGetTaskById_Success() {
        Task saved = taskService.createTask(testTask);

        Task found = taskService.getTaskById(saved.getId());

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("Implement User Registration", found.getName());
    }

    @Test
    void testGetTaskById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () -> {
            taskService.getTaskById(999L);
        });
    }

    @Test
    void testUpdateTask_Success() {
        Task saved = taskService.createTask(testTask);

        Task updatedTask = new Task();
        updatedTask.setName("Updated Task Name");
        updatedTask.setDescription("Updated description");
        updatedTask.setStatus(TaskStatus.IN_PROGRESS);
        updatedTask.setPriority(Priority.URGENT);
        updatedTask.setProgress(50);
        updatedTask.setDueDate(LocalDate.now().plusDays(3));
        updatedTask.setSprint(testSprint);
        updatedTask.setAssignedUser(testUser);

        Task updated = taskService.updateTask(saved.getId(), updatedTask);

        assertEquals("Updated Task Name", updated.getName());
        assertEquals(TaskStatus.IN_PROGRESS, updated.getStatus());
        assertEquals(Priority.URGENT, updated.getPriority());
        assertEquals(50, updated.getProgress());
    }

    @Test
    void testUpdateProgress_Success() {
        Task saved = taskService.createTask(testTask);

        Task updated = taskService.updateProgress(saved.getId(), 75);

        assertEquals(75, updated.getProgress());
    }

    @Test
    void testUpdateProgress_Negative_ThrowsException() {
        Task saved = taskService.createTask(testTask);

        assertThrows(IllegalArgumentException.class, () -> {
            taskService.updateProgress(saved.getId(), -5);
        });
    }

    @Test
    void testUpdateProgress_Over100_ThrowsException() {
        Task saved = taskService.createTask(testTask);

        assertThrows(IllegalArgumentException.class, () -> {
            taskService.updateProgress(saved.getId(), 150);
        });
    }

    @Test
    void testGetTasksByStatus_Success() {
        taskService.createTask(testTask);

        Task secondTask = new Task();
        secondTask.setName("Implement Login");
        secondTask.setDescription("Create login endpoint");
        secondTask.setStatus(TaskStatus.IN_PROGRESS);
        secondTask.setPriority(Priority.MEDIUM);
        secondTask.setProgress(0);
        secondTask.setSprint(testSprint);
        secondTask.setAssignedUser(testUser);
        taskService.createTask(secondTask);

        List<Task> backlogTasks = taskService.getTasksByStatus(TaskStatus.PRODUCT_BACKLOG);
        List<Task> inProgressTasks = taskService.getTasksByStatus(TaskStatus.IN_PROGRESS);

        assertEquals(1, backlogTasks.size());
        assertEquals(1, inProgressTasks.size());
    }

    @Test
    void testGetTasksBySprint_Success() {
        taskService.createTask(testTask);

        Task secondTask = new Task();
        secondTask.setName("Implement Login");
        secondTask.setDescription("Create login endpoint");
        secondTask.setStatus(TaskStatus.PRODUCT_BACKLOG);
        secondTask.setPriority(Priority.MEDIUM);
        secondTask.setProgress(0);
        secondTask.setSprint(testSprint);
        secondTask.setAssignedUser(testUser);
        taskService.createTask(secondTask);

        List<Task> tasks = taskService.getTasksBySprint(testSprint.getId());

        assertEquals(2, tasks.size());
    }

    @Test
    void testDeleteTask_Success() {
        Task saved = taskService.createTask(testTask);

        taskService.deleteTask(saved.getId());

        assertThrows(RuntimeException.class, () -> {
            taskService.getTaskById(saved.getId());
        });
    }

    @Test
    void testGetTasksBySprint_NotFound_ReturnsEmpty() {
        List<Task> tasks = taskService.getTasksBySprint(999L);

        assertNotNull(tasks);
        assertTrue(tasks.isEmpty());
    }
}