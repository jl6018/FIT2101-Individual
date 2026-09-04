package webapplication.repository;

import webapplication.model.Task;
import webapplication.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);

    List<Task> findBySprintId(Long sprintId);
}
