import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import webapplication.Application;
import webapplication.dto.TaskCommentResponse;
import webapplication.model.Task;
import webapplication.model.User;
import webapplication.repository.TaskCommentRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.UserRepository;
import webapplication.service.TaskCommentService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TaskCommentService (US12).
 * Tests adding, listing, fetching recent, and deleting task comments.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:commentdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TaskCommentServiceTest {

    @Autowired
    private TaskCommentService commentService;

    @Autowired
    private TaskCommentRepository commentRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Task testTask;

    /**
     * Sets up fresh test data before each test.
     */
    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        taskRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Commenter");
        testUser.setEmail("commenter@example.com");
        testUser.setPassword("password123");
        testUser.setRole("EMPLOYEE");
        testUser = userRepository.save(testUser);

        testTask = new Task();
        testTask.setName("Implement API");
        testTask.setProgress(0);
        testTask = taskRepository.save(testTask);
    }

    /**
     * US12: adding a comment saves it with an assigned ID.
     */
    @Test
    void testAddComment_Success() {
        TaskCommentResponse saved = commentService.addComment(
                testTask.getId(), testUser.getId(), "Looks good");

        assertNotNull(saved.getId());
        assertEquals("Looks good", saved.getBody());
        assertEquals(testUser.getId(), saved.getAuthorId());
        assertEquals(testTask.getId(), saved.getTaskId());
    }

    /**
     * US12: blank comment bodies are rejected.
     */
    @Test
    void testAddComment_BlankBody_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                commentService.addComment(testTask.getId(), testUser.getId(), "   "));
    }

    /**
     * US12: adding to a missing task throws.
     */
    @Test
    void testAddComment_TaskNotFound_Throws() {
        assertThrows(RuntimeException.class, () ->
                commentService.addComment(999L, testUser.getId(), "Hello"));
    }

    /**
     * US12: adding with a missing author throws.
     */
    @Test
    void testAddComment_UserNotFound_Throws() {
        assertThrows(RuntimeException.class, () ->
                commentService.addComment(testTask.getId(), 999L, "Hello"));
    }

    /**
     * US12: comments come back in chronological order.
     */
    @Test
    void testGetCommentsByTask_Success() {
        commentService.addComment(testTask.getId(), testUser.getId(), "First");
        commentService.addComment(testTask.getId(), testUser.getId(), "Second");

        List<TaskCommentResponse> rows = commentService.getCommentsByTask(testTask.getId());

        assertEquals(2, rows.size());
        assertEquals("First", rows.get(0).getBody());
        assertEquals("Second", rows.get(1).getBody());
    }

    /**
     * US12: comments on a missing task throw.
     */
    @Test
    void testGetCommentsByTask_NotFound_Throws() {
        assertThrows(RuntimeException.class, () ->
                commentService.getCommentsByTask(999L));
    }

    /**
     * US12: recent comments are capped by the requested limit.
     */
    @Test
    void testGetRecentComments_Success() {
        commentService.addComment(testTask.getId(), testUser.getId(), "One");
        commentService.addComment(testTask.getId(), testUser.getId(), "Two");
        commentService.addComment(testTask.getId(), testUser.getId(), "Three");

        List<TaskCommentResponse> rows = commentService.getRecentComments(2);

        assertEquals(2, rows.size());
    }

    /**
     * US12: deleting a comment removes it.
     */
    @Test
    void testDeleteComment_Success() {
        TaskCommentResponse saved = commentService.addComment(
                testTask.getId(), testUser.getId(), "Delete me");

        commentService.deleteComment(saved.getId());

        assertTrue(commentRepository.findById(saved.getId()).isEmpty());
    }

    /**
     * US12: deleting a missing comment throws.
     */
    @Test
    void testDeleteComment_NotFound_Throws() {
        assertThrows(RuntimeException.class, () ->
                commentService.deleteComment(999L));
    }
}