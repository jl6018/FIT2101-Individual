package webapplication.controller;

import webapplication.dto.TaskCommentResponse;
import webapplication.service.TaskCommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for task comments.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskCommentController {

    private final TaskCommentService commentService;

    /**
     * Constructor with the required TaskCommentService dependency.
     *
     * @param commentService The service handling task comment operations
     */
    public TaskCommentController(TaskCommentService commentService) {
        this.commentService = commentService;
    }

    /**
     * Returns the N most recent comments across all tasks.
     * Used by the admin notification bell.
     *
     * @param limit  How many to return (default 20)
     * @return       200 with the list
     */
    @GetMapping("/comments/recent")
    public List<TaskCommentResponse> getRecentComments(
            @RequestParam(name = "limit", required = false, defaultValue = "20") int limit) {
        return commentService.getRecentComments(limit);
    }

    /**
     * Retrieves all comments for a specific task, oldest first.
     *
     * @param taskId The ID of the task
     * @return       200 with the list, or 404 if the task does not exist
     */
    @GetMapping("/{taskId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long taskId) {
        try {
            List<TaskCommentResponse> list = commentService.getCommentsByTask(taskId);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Adds a new comment to a task.
     *
     * @param taskId The ID of the task to comment on
     * @param body   The request body containing authorId and body text
     * @return       200 with the saved comment, or 400/404 with a message on failure
     */
    @PostMapping("/{taskId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long taskId,
                                        @RequestBody Map<String, Object> body) {
        try {
            Object authorObj = body.get("authorId");
            String text = (String) body.get("body");

            if (authorObj == null) {
                return ResponseEntity.badRequest().body("authorId is required");
            }
            Long authorId;
            try {
                authorId = Long.valueOf(String.valueOf(authorObj));
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("authorId must be a number");
            }

            TaskCommentResponse saved = commentService.addComment(taskId, authorId, text);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Deletes a comment from a task. Allowed for ADMIN, PRODUCT_OWNER,
     * and EMPLOYEE callers (role from the X-Role header).
     *
     * @param taskId    The ID of the task (unused, present for URL consistency)
     * @param commentId The ID of the comment to delete
     * @param role      The caller's role from the X-Role header
     * @return          204 No Content on success, 403 if not allowed, 404 if not found
     */
    @DeleteMapping("/{taskId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long taskId,
            @PathVariable Long commentId,
            @RequestHeader(value = "X-Role", required = false) String role) {

        if (!"ADMIN".equalsIgnoreCase(role)
                && !"PRODUCT_OWNER".equalsIgnoreCase(role)
                && !"EMPLOYEE".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Not allowed");
        }

        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}