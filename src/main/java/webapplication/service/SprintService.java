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
 * Manages sprint Create, Read, Update, status transition, and Delete operations.
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

    /**
     * Updates a PLANNED sprint's name, dates, and member count.
     * Refuses to edit ACTIVE or COMPLETED sprints.
     *
     * @param id                    The sprint to update
     * @param updatedSprint         The incoming values
     * @return                      The saved Sprint object
     * @throws IllegalArgumentException if the sprint is not PLANNED
     * @throws RuntimeException         if the sprint does not exist
     */
    public Sprint updateSprint(Long id, Sprint updatedSprint) {
        Sprint sprint = getSprintById(id);

        if (sprint.getStatus() != SprintStatus.PLANNED) {
            throw new IllegalArgumentException(
                    "Only PLANNED sprints can be edited. This sprint is "
                            + sprint.getStatus() + ".");
        }

        if (updatedSprint.getName() != null && !updatedSprint.getName().isBlank()) {
            sprint.setName(updatedSprint.getName().trim());
        }
        if (updatedSprint.getStartDate() != null) {
            sprint.setStartDate(updatedSprint.getStartDate());
        }
        if (updatedSprint.getEndDate() != null) {
            sprint.setEndDate(updatedSprint.getEndDate());
        }
        if (updatedSprint.getMemberCount() > 0) {
            sprint.setMemberCount(updatedSprint.getMemberCount());
        }

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

    @Transactional
    public void deleteSprint(Long id) {
        List<Task> tasks = taskRepository.findBySprintId(id);

        for (Task task : tasks) {
            List<TimeLog> logs = timeLogRepository.findByTaskId(task.getId());
            if (!logs.isEmpty()) {
                timeLogRepository.deleteAll(logs);
            }
            taskCommentRepository.deleteByTaskId(task.getId());
            task.getTags().clear();
            taskRepository.save(task);
        }

        if (!tasks.isEmpty()) {
            taskRepository.deleteAll(tasks);
        }

        sprintRepository.deleteById(id);
    }
}