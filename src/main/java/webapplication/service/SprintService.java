package webapplication.service;

import webapplication.model.Sprint;
import webapplication.model.SprintStatus;
import webapplication.model.Task;
import webapplication.model.TimeLog;
import webapplication.repository.SprintRepository;
import webapplication.repository.TaskCommentRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Manages sprint Create, Read, status transition, and Delete operations.
 * Deleting a sprint cascades to its tasks, those tasks' time logs,
 * their tags (join table), and their comments.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class SprintService {

    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;
    private final TaskCommentRepository taskCommentRepository;

    public SprintService(SprintRepository sprintRepository,
                         TaskRepository taskRepository,
                         TimeLogRepository timeLogRepository,
                         TaskCommentRepository taskCommentRepository) {
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.timeLogRepository = timeLogRepository;
        this.taskCommentRepository = taskCommentRepository;
    }

    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    public Sprint getSprintById(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
    }

    public Sprint getLatestByName(String name) {
        return sprintRepository.findTopByNameOrderByIdDesc(name)
                .orElseThrow(() -> new RuntimeException("No sprint named '" + name + "'"));
    }

    public Sprint createSprint(Sprint sprint) {
        sprint.setStatus(SprintStatus.PLANNED);
        return sprintRepository.save(sprint);
    }

    public Sprint startSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.ACTIVE);
        return sprintRepository.save(sprint);
    }

    public Sprint completeSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.COMPLETED);
        return sprintRepository.save(sprint);
    }

    /**
     * Deletes a sprint and every child record that references it.
     *
     * Order of deletion is critical — MySQL will refuse to delete any row
     * that is still being referenced by a foreign key, so child tables
     * must be cleared first, parents last:
     *
     *   1. time_logs   (references tasks.id)
     *   2. task_comments (references tasks.id)
     *   3. task_tags   (join table referencing tasks.id and tags.id)
     *   4. tasks       (references sprints.id)
     *   5. sprints     (the row we actually want gone)
     *
     * @param id The ID of the sprint to delete
     */
    @Transactional
    public void deleteSprint(Long id) {
        List<Task> tasks = taskRepository.findBySprintId(id);

        for (Task task : tasks) {
            // 1. time logs
            List<TimeLog> logs = timeLogRepository.findByTaskId(task.getId());
            if (!logs.isEmpty()) {
                timeLogRepository.deleteAll(logs);
            }

            // 2. comments
            taskCommentRepository.deleteByTaskId(task.getId());

            // 3. tags (clears join table rows via cascade on the @ManyToMany)
            task.getTags().clear();
            taskRepository.save(task);
        }

        // 4. tasks
        if (!tasks.isEmpty()) {
            taskRepository.deleteAll(tasks);
        }

        // 5. sprint
        sprintRepository.deleteById(id);
    }
}