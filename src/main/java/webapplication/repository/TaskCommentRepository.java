package webapplication.repository;

import webapplication.model.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository for task comments.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {

    /**
     * Returns all comments on a task, oldest first (chronological order).
     */
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    /**
     * Returns the most recent N comments across ALL tasks,
     * newest first. Used by the admin notification bell.
     */
    List<TaskComment> findTop20ByOrderByCreatedAtDesc();

    /**
     * Deletes every comment on a task.
     */
    void deleteByTaskId(Long taskId);

    /**
     * Counts comments on a task. Used for the "comment count" badge.
     */
    long countByTaskId(Long taskId);
}