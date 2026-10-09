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

    public TaskCommentService(TaskCommentRepository commentRepository,
                              TaskRepository taskRepository,
                              UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns all comments on a task, oldest first.
     *
     * @param taskId The task ID
     * @return       Comments as response DTOs
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
     * Creates a new comment on a task.
     *
     * @param taskId    The task ID
     * @param authorId  The ID of the user posting
     * @param body      The comment text (max 2000 characters)
     * @return          The saved comment as a response DTO
     * @throws IllegalArgumentException if body is null or blank
     * @throws RuntimeException         if task or user does not exist
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
     * Deletes a single comment by its ID.
     *
     * @param commentId The comment ID
     * @throws RuntimeException if the comment does not exist
     */
    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new RuntimeException("Comment not found");
        }
        commentRepository.deleteById(commentId);
    }

    private TaskCommentResponse toDto(TaskComment c) {
        return new TaskCommentResponse(
                c.getId(),
                c.getBody(),
                c.getCreatedAt(),
                c.getAuthor() != null ? c.getAuthor().getId() : null,
                c.getAuthor() != null ? c.getAuthor().getName() : "Unknown",
                c.getAuthor() != null ? c.getAuthor().getRole() : ""
        );
    }
}