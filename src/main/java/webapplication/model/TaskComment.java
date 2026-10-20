package webapplication.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * One message in a task's comment thread.
 * Both employees and admins can post comments; both see the same list.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Entity
@Table(name = "task_comments")
public class TaskComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 2000, nullable = false)
    private String body;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    /**
     * No-argument constructor required by JPA.
     */
    public TaskComment() {
    }

    /**
     * Constructs a new TaskComment with the given task, author, and body.
     * The creation timestamp is set to the current time.
     *
     * @param task   The task this comment belongs to
     * @param author The user authoring the comment
     * @param body   The comment text
     */
    public TaskComment(Task task, User author, String body) {
        this.task = task;
        this.author = author;
        this.body = body;
        this.createdAt = LocalDateTime.now();
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
     * Returns the task this comment belongs to.
     *
     * @return The associated Task
     */
    public Task getTask() { return task; }

    /**
     * Sets the task this comment belongs to.
     *
     * @param task The associated Task
     */
    public void setTask(Task task) { this.task = task; }

    /**
     * Returns the user who authored the comment.
     *
     * @return The comment author
     */
    public User getAuthor() { return author; }

    /**
     * Sets the user who authored the comment.
     *
     * @param author The comment author
     */
    public void setAuthor(User author) { this.author = author; }
}