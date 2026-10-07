package webapplication.controller;

import webapplication.model.Tag;
import webapplication.model.Task;
import webapplication.service.TagService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for tag management (US13) and filtering (US14).
 *
 * @author Symph Team
 * @version 17.0.16
 */
@RestController
@RequestMapping("/api/tags")
@CrossOrigin(origins = {"http://localhost:8080", "http://127.0.0.1:8080"},
        allowedHeaders = {"Content-Type", "X-Role"})
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public List<Tag> getAllTags() {
        return tagService.getAllTags();
    }

    /**
     * Adds a tag to a task. Creates the tag if it doesn't exist.
     *
     * @param taskId  The task to tag
     * @param body    { "name": "frontend" }
     * @return        The updated task
     */
    @PostMapping("/task/{taskId}")
    public ResponseEntity<?> addTag(@PathVariable Long taskId,
                                    @RequestBody Map<String, String> body) {
        try {
            Task updated = tagService.addTagToTask(taskId, body.get("name"));
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Removes a tag from a task.
     */
    @DeleteMapping("/task/{taskId}/{tagId}")
    public ResponseEntity<?> removeTag(@PathVariable Long taskId,
                                       @PathVariable Long tagId) {
        try {
            Task updated = tagService.removeTagFromTask(taskId, tagId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}