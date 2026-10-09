package webapplication.service;

import webapplication.model.Sprint;
import webapplication.model.SprintStatus;
import webapplication.model.Task;
import webapplication.model.TimeLog;
import webapplication.repository.SprintRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages sprint Create, Read, status transition, and Delete operations.
 * Deleting a sprint also cascades to its tasks and those tasks' time logs.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class SprintService {

    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;

    /**
     * Parameterized constructor with the required repository dependencies.
     *
     * @param sprintRepository  The repository handling sprint database operations
     * @param taskRepository    The repository handling task database operations
     * @param timeLogRepository The repository handling time log database operations
     */
    public SprintService(SprintRepository sprintRepository,
                         TaskRepository taskRepository,
                         TimeLogRepository timeLogRepository) {
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.timeLogRepository = timeLogRepository;
    }

    /**
     * Retrieves all sprints from the database.
     *
     * @return A list of all sprints
     */
    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    /**
     * Retrieves a single sprint by its unique ID.
     *
     * @param id                The ID of the sprint to retrieve
     * @return                  The Sprint object
     * @throws RuntimeException if no sprint with the given ID exists
     */
    public Sprint getSprintById(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
    }

    /**
     * Retrieves the most recent sprint with the given name.
     *
     * @param name              The name of the sprint to search for
     * @return                  The latest matching Sprint object
     * @throws RuntimeException if no sprint with the given name exists
     */
    public Sprint getLatestByName(String name) {
        return sprintRepository.findTopByNameOrderByIdDesc(name)
                .orElseThrow(() -> new RuntimeException("No sprint named '" + name + "'"));
    }

    /**
     * Creates a new sprint with a PLANNED status.
     *
     * @param sprint The Sprint object to save
     * @return       The saved Sprint object with its assigned ID
     */
    public Sprint createSprint(Sprint sprint) {
        sprint.setStatus(SprintStatus.PLANNED);
        return sprintRepository.save(sprint);
    }

    /**
     * Starts a sprint by transitioning its status to ACTIVE.
     *
     * @param id                The ID of the sprint to start
     * @return                  The updated Sprint object
     * @throws RuntimeException if the sprint does not exist
     */
    public Sprint startSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.ACTIVE);
        return sprintRepository.save(sprint);
    }

    /**
     * Completes a sprint by transitioning its status to COMPLETED.
     *
     * @param id                The ID of the sprint to complete
     * @return                  The updated Sprint object
     * @throws RuntimeException if the sprint does not exist
     */
    public Sprint completeSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.COMPLETED);
        return sprintRepository.save(sprint);
    }

    /**
     * Deletes a sprint from the database by its ID, along with any tasks
     * attached to it and those tasks' time logs.
     *
     * The order matters:
     *   1. Delete time logs whose task belongs to this sprint.
     *   2. Delete the tasks themselves.
     *   3. Delete the sprint.
     *
     * Without step 1 and 2, MySQL would refuse the delete with a foreign
     * key constraint violation (which the browser would show as HTTP 500).
     *
     * @param id The ID of the sprint to delete
     */
    public void deleteSprint(Long id) {
        // 1. Delete time logs for every task in this sprint.
        List<Task> tasks = taskRepository.findBySprintId(id);
        for (Task task : tasks) {
            List<TimeLog> logs = timeLogRepository.findByTaskId(task.getId());
            if (!logs.isEmpty()) {
                timeLogRepository.deleteAll(logs);
            }
        }

        // 2. Delete the tasks themselves.
        if (!tasks.isEmpty()) {
            taskRepository.deleteAll(tasks);
        }

        // 3. Now it's safe to delete the sprint.
        sprintRepository.deleteById(id);
    }
}