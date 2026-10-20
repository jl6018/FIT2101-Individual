package webapplication.service;

import webapplication.dto.TaskCommentResponse;
import webapplication.model.Task;
import webapplication.model.TaskComment;
import webapplication.model.User;
import webapplication.repository.TaskCommentRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Manages creation, retrieval, and deletion of task comments.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class TaskCommentService {

    private final TaskCommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    /**
     * Constructor with the required repository dependencies.
     *
     * @param commentRepository The repository handling task comment database operations
     * @param taskRepository    The repository handling task database operations
     * @param userRepository    The repository handling user database operations
     */
    public TaskCommentService(TaskCommentRepository commentRepository,
                              TaskRepository taskRepository,
                              UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    /**
     * Retrieves all comments for a specific task, oldest first.
     *
     * @param taskId            The ID of the task
     * @return                  A list of TaskCommentResponse DTOs
     * @throws RuntimeException if the task does not exist
     */
    public List<TaskCommentResponse> getCommentsByTask(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new RuntimeException("Task not found");
        }
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Returns the N most recent comments across all tasks,
     * newest first. Used by the admin notification bell.
     *
     * @param limit  How many to return (defaults to 20 if ≤ 0)
     * @return       A list of TaskCommentResponse DTOs
     */
    public List<TaskCommentResponse> getRecentComments(int limit) {
        List<TaskComment> comments = commentRepository.findTop20ByOrderByCreatedAtDesc();
        int effectiveLimit = (limit > 0) ? Math.min(limit, 50) : 20;
        return comments.stream()
                .limit(effectiveLimit)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Adds a new comment to a task. The body is trimmed and truncated to
     * 2000 characters if longer.
     *
     * @param taskId            The ID of the task to comment on
     * @param authorId          The ID of the user authoring the comment
     * @param body              The comment text
     * @return                  The saved comment as a TaskCommentResponse DTO
     * @throws IllegalArgumentException if the body is null or blank
     * @throws RuntimeException         if the task or user does not exist
     */
    public TaskCommentResponse addComment(Long taskId, Long authorId, String body) {
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Comment body is required");
        }
        String trimmed = body.trim();
        if (trimmed.length() > 2000) {
            trimmed = trimmed.substring(0, 2000);
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TaskComment comment = new TaskComment(task, author, trimmed);
        TaskComment saved = commentRepository.save(comment);
        return toDto(saved);
    }

    /**
     * Deletes a comment by its ID.
     *
     * @param commentId         The ID of the comment to delete
     * @throws RuntimeException if no comment with the given ID exists
     */
    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new RuntimeException("Comment not found");
        }
        commentRepository.deleteById(commentId);
    }

    /**
     * Converts a TaskComment entity to its response DTO.
     *
     * @param c The TaskComment entity
     * @return  The corresponding TaskCommentResponse DTO
     */
    private TaskCommentResponse toDto(TaskComment c) {
        Long taskId = (c.getTask() != null) ? c.getTask().getId() : null;
        String taskName = (c.getTask() != null) ? c.getTask().getName() : "";

        return new TaskCommentResponse(
                c.getId(),
                c.getBody(),
                c.getCreatedAt(),
                c.getAuthor() != null ? c.getAuthor().getId() : null,
                c.getAuthor() != null ? c.getAuthor().getName() : "Unknown",
                c.getAuthor() != null ? c.getAuthor().getRole() : "",
                taskId,
                taskName
        );
    }
}