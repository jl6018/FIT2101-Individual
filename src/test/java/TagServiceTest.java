import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import webapplication.Application;
import webapplication.model.Tag;
import webapplication.model.Task;
import webapplication.repository.TagRepository;
import webapplication.repository.TaskRepository;
import webapplication.service.TagService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TagService (US13 / US14).
 * Tests tag creation, attaching tags to tasks, deduplication, and removal.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:tagdb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TagServiceTest {

    @Autowired
    private TagService tagService;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private TaskRepository taskRepository;

    private Task testTask;

    /**
     * Sets up fresh test data before each test.
     */
    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
        tagRepository.deleteAll();

        testTask = new Task();
        testTask.setName("Implement API");
        testTask.setProgress(0);
        testTask = taskRepository.save(testTask);
    }

    /**
     * US13: adding a new tag creates the tag and attaches it to the task.
     */
    @Test
    void testAddTagToTask_CreatesNewTag() {
        Task updated = tagService.addTagToTask(testTask.getId(), "frontend");

        assertEquals(1, updated.getTags().size());
        assertTrue(updated.getTags().stream()
                .anyMatch(t -> t.getName().equals("frontend")));
        assertEquals(1, tagRepository.findAll().size());
    }

    /**
     * US13: tag names are normalised to lowercase and trimmed.
     */
    @Test
    void testAddTagToTask_NormalisesName() {
        Task updated = tagService.addTagToTask(testTask.getId(), "  FRONTEND  ");

        assertTrue(updated.getTags().stream()
                .anyMatch(t -> t.getName().equals("frontend")));
    }

    /**
     * US13: adding the same tag twice does not duplicate it on the task.
     */
    @Test
    void testAddTagToTask_Duplicate_NoOp() {
        tagService.addTagToTask(testTask.getId(), "frontend");
        Task updated = tagService.addTagToTask(testTask.getId(), "frontend");

        assertEquals(1, updated.getTags().size());
        assertEquals(1, tagRepository.findAll().size());
    }

    /**
     * US13: reusing an existing tag does not create a second Tag row.
     */
    @Test
    void testAddTagToTask_ReusesExistingTag() {
        tagRepository.save(new Tag("backend"));

        tagService.addTagToTask(testTask.getId(), "backend");

        assertEquals(1, tagRepository.findAll().size());
    }

    /**
     * US13: blank tag names are rejected.
     */
    @Test
    void testAddTagToTask_BlankName_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                tagService.addTagToTask(testTask.getId(), "   "));
    }

    /**
     * US13: adding a tag to a missing task throws.
     */
    @Test
    void testAddTagToTask_TaskNotFound_Throws() {
        assertThrows(RuntimeException.class, () ->
                tagService.addTagToTask(999L, "frontend"));
    }

    /**
     * US13: removing a tag from a task detaches it.
     */
    @Test
    void testRemoveTagFromTask_Success() {
        Task updated = tagService.addTagToTask(testTask.getId(), "frontend");
        Long tagId = updated.getTags().iterator().next().getId();

        Task afterRemoval = tagService.removeTagFromTask(testTask.getId(), tagId);

        assertTrue(afterRemoval.getTags().isEmpty());
    }

    /**
     * US13: removing a tag from a missing task throws.
     */
    @Test
    void testRemoveTagFromTask_TaskNotFound_Throws() {
        assertThrows(RuntimeException.class, () ->
                tagService.removeTagFromTask(999L, 1L));
    }

    /**
     * US13: getAllTags returns every tag in the database.
     */
    @Test
    void testGetAllTags_Success() {
        tagService.addTagToTask(testTask.getId(), "frontend");
        tagService.addTagToTask(testTask.getId(), "backend");

        List<Tag> tags = tagService.getAllTags();

        assertEquals(2, tags.size());
    }
}