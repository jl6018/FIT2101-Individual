package webapplication.service;

import webapplication.model.Sprint;
import webapplication.model.Task;
import webapplication.model.TaskStatus;
import webapplication.model.TimeLog;
import webapplication.model.User;
import webapplication.repository.SprintRepository;
import webapplication.repository.TaskCommentRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
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
    private final TimeLogRepository timeLogRepository;
    private final TaskCommentRepository taskCommentRepository;

    /**
     * Parameterized constructor with the required repository dependencies.
     */
    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository,
                       SprintRepository sprintRepository,
                       TimeLogRepository timeLogRepository,
                       TaskCommentRepository taskCommentRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.sprintRepository = sprintRepository;
        this.timeLogRepository = timeLogRepository;
        this.taskCommentRepository = taskCommentRepository;
    }

    /**
     * Retrieves all tasks ordered by board position.
     */
    public List<Task> getAllTasks() {
        return taskRepository.findAllByOrderByPositionAscIdAsc();
    }

    /**
     * Retrieves a single task by its unique ID.
     *
     * @throws RuntimeException if no task with the given ID exists
     */
    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    /**
     * Creates a new task with default status and position handling.
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
     */
    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatusOrderByPositionAscIdAsc(status);
    }

    /**
     * Retrieves all tasks belonging to a specific sprint ordered by board position.
     */
    public List<Task> getTasksBySprint(Long sprintId) {
        return taskRepository.findBySprintIdOrderByPositionAscIdAsc(sprintId);
    }

    /**
     * Deletes a task along with its dependent time logs and comments.
     * Time logs and comments are removed first so the DB does not raise a
     * foreign key constraint violation on task_id.
     */
    public void deleteTask(Long id) {
        List<TimeLog> logs = timeLogRepository.findByTaskId(id);
        if (!logs.isEmpty()) {
            timeLogRepository.deleteAll(logs);
        }
        taskCommentRepository.deleteByTaskId(id);
        taskRepository.deleteById(id);
    }

    /**
     * Assigns a task to a specific user.
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
     */
    public Task updateStatus(Long taskId, TaskStatus status) {
        Task task = getTaskById(taskId);
        task.setStatus(status);
        return taskRepository.save(task);
    }

    /**
     * Retrieves the board view grouping tasks by their status.
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