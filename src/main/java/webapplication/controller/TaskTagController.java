package webapplication.controller;

import webapplication.model.Task;
import webapplication.service.TagService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Handles the HTTP request that saves all the tags of a task at once (US13).
 * The User board sends the whole list of tags each time a tag is added or removed.
 * Maps requests to /api/tasks and delegates to the TagService class.
 *
 * @author Lim Jia Li
 * @author Atifah
 * @version 17.0.16
 */
@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskTagController {

    private final TagService tagService;

    /**
     * Constructor
     *
     * @param tagService The service handling tag logic
     */
    public TaskTagController(TagService tagService) {
        this.tagService = tagService;
    }

    /**
     * Replaces all the tags on a task.
     *
     * @param taskId The ID of the task
     * @param body   The request body holding the list of tag names
     * @return       200 with the updated task, or 404 if the task does not exist
     */
    @PutMapping("/{taskId}/tags")
    public ResponseEntity<?> replaceTags(@PathVariable Long taskId,
                                         @RequestBody Map<String, List<String>> body) {
        try {
            Task updated = tagService.replaceTags(taskId, body.get("tags"));
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
