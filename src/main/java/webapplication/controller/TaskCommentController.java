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

    @GetMapping("/{taskId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long taskId) {
        try {
            List<TaskCommentResponse> list = commentService.getCommentsByTask(taskId);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

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