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
     *
     * @param taskId The task ID
     * @return       Comments on that task, oldest first
     */
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    /**
     * Deletes every comment on a task. Used when the task itself is deleted.
     *
     * @param taskId The task ID
     */
    void deleteByTaskId(Long taskId);
}