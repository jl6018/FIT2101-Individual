package webapplication.service;

import webapplication.model.Sprint;
import webapplication.model.Task;
import webapplication.model.TaskStatus;
import webapplication.model.User;
import webapplication.repository.SprintRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Manages task Create, Read, Update, Delete, assignment, board ordering,
 * and team-based filtering operations.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;

    /**
     * Parameterized constructor with the required repository dependencies.
     *
     * @param taskRepository   The repository handling task database operations
     * @param userRepository   The repository handling user database operations
     * @param sprintRepository The repository handling sprint database operations
     */
    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository,
                       SprintRepository sprintRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.sprintRepository = sprintRepository;
    }

    /**
     * Retrieves all tasks ordered by board position.
     *
     * @return A list of all tasks
     */
    public List<Task> getAllTasks() {
        return taskRepository.findAllByOrderByPositionAscIdAsc();
    }

    /**
     * Retrieves a single task by its unique ID.
     *
     * @param id                The ID of the task to retrieve
     * @return                  The Task object
     * @throws RuntimeException if no task with the given ID exists
     */
    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    /**
     * Creates a new task with default status and position handling.
     * If no status is provided, defaults to PRODUCT_BACKLOG.
     * If no position is provided, places the task at the bottom of its column.
     *
     * @param task The Task object to save
     * @return     The saved Task object with its assigned ID and position
     */
    public Task createTask(Task task) {
        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.PRODUCT_BACKLOG);
        }
        if (task.getProgress() < 0) {
            task.setProgress(0);
        } else if (task.getProgress() > 100) {
            task.setProgress(100);
        }

        if (task.getSprint() != null && task.getSprint().getId() != null) {
            Sprint sprint = sprintRepository.findById(task.getSprint().getId())
                    .orElse(null);
            task.setSprint(sprint);
        } else {
            task.setSprint(null);
        }

        if (task.getPosition() == null || task.getPosition() <= 0) {
            int maxPos = taskRepository.findAllByOrderByPositionAscIdAsc().stream()
                    .filter(t -> t.getStatus() == task.getStatus())
                    .map(Task::getPosition)
                    .filter(p -> p != null)
                    .mapToInt(Integer::intValue)
                    .max()
                    .orElse(0);
            task.setPosition(maxPos + 1);
        }

        return taskRepository.save(task);
    }

    /**
     * Updates an existing task's details. Only non-null fields are overwritten.
     *
     * @param id                The ID of the task to update
     * @param taskDetails       The Task object containing the updated details
     * @return                  The updated Task object
     * @throws RuntimeException if the task does not exist
     */
    public Task updateTask(Long id, Task taskDetails) {
        Task task = getTaskById(id);

        if (taskDetails.getName() != null) task.setName(taskDetails.getName());
        if (taskDetails.getDescription() != null) task.setDescription(taskDetails.getDescription());
        if (taskDetails.getStatus() != null) task.setStatus(taskDetails.getStatus());
        if (taskDetails.getPriority() != null) task.setPriority(taskDetails.getPriority());
        if (taskDetails.getProgress() != 0) task.setProgress(taskDetails.getProgress());
        if (taskDetails.getDueDate() != null) task.setDueDate(taskDetails.getDueDate());

        if (taskDetails.getSprint() != null && taskDetails.getSprint().getId() != null) {
            Sprint sprint = sprintRepository.findById(taskDetails.getSprint().getId())
                    .orElse(null);
            task.setSprint(sprint);
        }

        if (taskDetails.getAssignedUser() != null) task.setAssignedUser(taskDetails.getAssignedUser());
        if (taskDetails.getAssignedTeams() != null) task.setAssignedTeams(taskDetails.getAssignedTeams());
        if (taskDetails.getAssignedEmployeeIds() != null) task.setAssignedEmployeeIds(taskDetails.getAssignedEmployeeIds());
        if (taskDetails.getEstimateHours() != 0) task.setEstimateHours(taskDetails.getEstimateHours());

        if (taskDetails.getPosition() != null) task.setPosition(taskDetails.getPosition());

        return taskRepository.save(task);
    }

    /**
     * Updates the progress percentage of a task.
     *
     * @param id                    The ID of the task to update
     * @param progress              The progress value between 0 and 100
     * @return                      The updated Task object
     * @throws IllegalArgumentException if progress is outside the 0-100 range
     * @throws RuntimeException         if the task does not exist
     */
    public Task updateProgress(Long id, int progress) {
        if (progress < 0 || progress > 100) {
            throw new IllegalArgumentException("Progress must be between 0 and 100");
        }
        Task task = getTaskById(id);
        task.setProgress(progress);
        return taskRepository.save(task);
    }

    /**
     * Retrieves all tasks with a specific status ordered by board position.
     *
     * @param status The TaskStatus to filter by
     * @return       A list of tasks matching the status
     */
    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatusOrderByPositionAscIdAsc(status);
    }

    /**
     * Retrieves all tasks belonging to a specific sprint ordered by board position.
     *
     * @param sprintId The ID of the sprint
     * @return         A list of tasks in the sprint
     */
    public List<Task> getTasksBySprint(Long sprintId) {
        return taskRepository.findBySprintIdOrderByPositionAscIdAsc(sprintId);
    }

    /**
     * Deletes a task from the database by its ID.
     *
     * @param id The ID of the task to delete
     */
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    /**
     * Assigns a task to a specific user.
     *
     * @param taskId            The ID of the task to assign
     * @param userId            The ID of the user to assign the task to
     * @return                  The updated Task object
     * @throws RuntimeException if the task or user does not exist
     */
    public Task assignTask(Long taskId, Long userId) {
        Task task = getTaskById(taskId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        task.setAssignedUser(user);
        return taskRepository.save(task);
    }

    /**
     * Updates the status of a task.
     *
     * @param taskId            The ID of the task to update
     * @param status            The new TaskStatus
     * @return                  The updated Task object
     * @throws RuntimeException if the task does not exist
     */
    public Task updateStatus(Long taskId, TaskStatus status) {
        Task task = getTaskById(taskId);
        task.setStatus(status);
        return taskRepository.save(task);
    }

    /**
     * Retrieves the board view grouping tasks by their status.
     * Each status column is ordered by board position.
     *
     * @return A map of TaskStatus to lists of tasks
     */
    public Map<TaskStatus, List<Task>> getBoardView() {
        Map<TaskStatus, List<Task>> board = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            board.put(status, taskRepository.findByStatusOrderByPositionAscIdAsc(status));
        }
        return board;
    }

    /**
     * Retrieves all tasks belonging to a specific team.
     * Matches tasks by direct team assignment or by assigned employee membership.
     *
     * @param teamName The name of the team
     * @return         A list of tasks assigned to the given team
     */
    public List<Task> getTasksByTeam(String teamName) {
        List<Long> teamMemberIds = userRepository.findAll().stream()
                .filter(u -> u.getTeam() != null && teamName.equals(u.getTeam().getName()))
                .map(User::getId)
                .collect(Collectors.toList());

        return taskRepository.findAllByOrderByPositionAscIdAsc().stream()
                .filter(t -> {
                    if (t.getAssignedTeams() != null) {
                        boolean direct = java.util.Arrays.stream(t.getAssignedTeams().split(","))
                                .map(String::trim)
                                .anyMatch(name -> name.equals(teamName));
                        if (direct) return true;
                    }
                    if (t.getAssignedEmployeeIds() != null) {
                        return java.util.Arrays.stream(t.getAssignedEmployeeIds().split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .map(Long::parseLong)
                                .anyMatch(teamMemberIds::contains);
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }
}