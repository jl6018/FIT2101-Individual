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

    /**
     * No-argument constructor required for JSON deserialization.
     */
    public TaskCommentResponse() {
    }

    /**
     * Constructs a response DTO with all fields populated.
     *
     * @param id         The comment's unique ID
     * @param body       The comment text
     * @param createdAt  The comment's creation timestamp
     * @param authorId   The author's unique ID
     * @param authorName The author's name
     * @param authorRole The author's role
     * @param taskId     The parent task's unique ID
     * @param taskName   The parent task's name
     */
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

    /**
     * Returns the comment's unique ID.
     *
     * @return The comment ID
     */
    public Long getId() { return id; }

    /**
     * Sets the comment's unique ID.
     *
     * @param id The comment ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Returns the comment text.
     *
     * @return The comment body
     */
    public String getBody() { return body; }

    /**
     * Sets the comment text.
     *
     * @param body The comment body
     */
    public void setBody(String body) { this.body = body; }

    /**
     * Returns the comment's creation timestamp.
     *
     * @return The creation date and time
     */
    public LocalDateTime getCreatedAt() { return createdAt; }

    /**
     * Sets the comment's creation timestamp.
     *
     * @param createdAt The creation date and time
     */
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    /**
     * Returns the author's unique ID.
     *
     * @return The author ID
     */
    public Long getAuthorId() { return authorId; }

    /**
     * Sets the author's unique ID.
     *
     * @param authorId The author ID
     */
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    /**
     * Returns the author's name.
     *
     * @return The author name
     */
    public String getAuthorName() { return authorName; }

    /**
     * Sets the author's name.
     *
     * @param authorName The author name
     */
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    /**
     * Returns the author's role.
     *
     * @return The author role
     */
    public String getAuthorRole() { return authorRole; }

    /**
     * Sets the author's role.
     *
     * @param authorRole The author role
     */
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    /**
     * Returns the parent task's unique ID.
     *
     * @return The task ID
     */
    public Long getTaskId() { return taskId; }

    /**
     * Sets the parent task's unique ID.
     *
     * @param taskId The task ID
     */
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    /**
     * Returns the parent task's name.
     *
     * @return The task name
     */
    public String getTaskName() { return taskName; }

    /**
     * Sets the parent task's name.
     *
     * @param taskName The task name
     */
    public void setTaskName(String taskName) { this.taskName = taskName; }
}