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
@RequestMapping("/api/tasks/{taskId}/comments")
@CrossOrigin
public class TaskCommentController {

    private final TaskCommentService commentService;

    public TaskCommentController(TaskCommentService commentService) {
        this.commentService = commentService;
    }

    /**
     * Returns all comments on the given task, oldest first.
     *
     * @param taskId The task ID
     * @return       200 with the list, or 404 if the task does not exist
     */
    @GetMapping
    public ResponseEntity<?> getComments(@PathVariable Long taskId) {
        try {
            List<TaskCommentResponse> list = commentService.getCommentsByTask(taskId);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Posts a new comment on the given task.
     *
     * @param taskId  The task ID
     * @param body    { "authorId": 4, "body": "..." }
     * @return        200 with the saved comment, 400 on missing body, 404 if task/user not found
     */
    @PostMapping
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
     * Deletes a single comment on a task.
     * A lightweight role guard is applied using the X-Role header.
     *
     * @param taskId      The task ID (kept for URL structure)
     * @param commentId   The comment ID
     * @param role        The caller's role, from the X-Role header
     * @return            204 No Content on success, 403 if not allowed, 404 if not found
     */
    @DeleteMapping("/{commentId}")
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