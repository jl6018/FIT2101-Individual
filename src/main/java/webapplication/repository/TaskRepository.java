package webapplication.repository;

import webapplication.model.Task;
import webapplication.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);

    List<Task> findBySprintId(Long sprintId);

    // ✅ NEW — sorted by position so the board renders in saved order
    List<Task> findAllByOrderByPositionAscIdAsc();

    List<Task> findByStatusOrderByPositionAscIdAsc(TaskStatus status);

    List<Task> findBySprintIdOrderByPositionAscIdAsc(Long sprintId);
}