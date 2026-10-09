package webapplication.dto;

import java.time.LocalDateTime;

/**
 * Response shape for a single task comment.
 * Includes the author's id, name, role, and the parent task's id/name
 * so the frontend can render a notification without a second fetch.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public class TaskCommentResponse {

    private Long id;
    private String body;
    private LocalDateTime createdAt;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private Long taskId;
    private String taskName;

    public TaskCommentResponse() {
    }

    public TaskCommentResponse(Long id, String body, LocalDateTime createdAt,
                               Long authorId, String authorName, String authorRole,
                               Long taskId, String taskName) {
        this.id = id;
        this.body = body;
        this.createdAt = createdAt;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorRole = authorRole;
        this.taskId = taskId;
        this.taskName = taskName;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }
}