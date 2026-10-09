package webapplication.dto;

import java.time.LocalDateTime;

/**
 * Response shape for a single task comment.
 * Includes the author's id, name and role so the frontend can render
 * the message without a second fetch.
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

    public TaskCommentResponse() {
    }

    public TaskCommentResponse(Long id, String body, LocalDateTime createdAt,
                               Long authorId, String authorName, String authorRole) {
        this.id = id;
        this.body = body;
        this.createdAt = createdAt;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorRole = authorRole;
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
}