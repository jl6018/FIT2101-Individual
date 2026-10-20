package webapplication.service;

import webapplication.model.Sprint;
import webapplication.model.Tag;
import webapplication.model.Task;
import webapplication.model.TaskStatus;
import webapplication.model.TimeLog;
import webapplication.model.User;
import webapplication.repository.SprintRepository;
import webapplication.repository.TaskCommentRepository;
import webapplication.repository.TaskRepository;
import webapplication.repository.TimeLogRepository;
import webapplication.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Manages task Create, Read, Update, Delete, assignment,
 * and  filtering (US14),due dates (US15)
 * progress (US16) and the admin tasks (US17, US18)
 *
 * @author Lim Jia Li
 * @author Atifah (US14 to US18)
 * @version 17.0.16
 */

@Service
public class TaskService {

    /**
     * Message returned when a task is completed without being In Review first
     * */
    private static final String NOT_IN_REVIEW_MESSAGE =
            "A task must be In Review before it can be completed.";

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final TimeLogRepository timeLogRepository;
    private final TaskCommentRepository taskCommentRepository;

    /**
     * constructor with the required repository dependencies
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
     * Retrieves all tasks
     */
    public List<Task> getAllTasks() {
        return taskRepository.findAllByOrderByPositionAscIdAsc();
    }

    /**
     * Retrieves a task by its ID
     *
     * @throws RuntimeException if no task with the given ID exists
     */
    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    /**
     * Creates a new task with default status
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
     * Updates an existing tasks details
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
     * Updates a task's details for a user with the given role (US17)
     *
     * @param id          The ID of the task to update
     * @param taskDetails The Task object containing the updated details
     * @param role        The role of the user making the change
     * @return            The updated Task object
     * @throws RuntimeException        if the task does not exist
     * @throws ResponseStatusException 403 if a non-admin completes or reopens a task,
     *                                 or 409 if a task is completed without being In Review
     */
    public Task updateTask(Long id, Task taskDetails, String role) {
        Task current = getTaskById(id);
        checkStatusChange(current.getStatus(), taskDetails.getStatus(), role);
        return updateTask(id, taskDetails);
    }

    /**
     * Saves who a task is assigned to
     * @param id                  The ID of the task to update
     * @param assignedTeams       Team names separated by commas, or null
     * @param assignedEmployeeIds Employee IDs separated by commas, or null
     * @return                    The updated task
     * @throws RuntimeException   if the task does not exist
     */
    public Task updateAssignees(Long id, String assignedTeams, String assignedEmployeeIds) {
        Task task = getTaskById(id);
        task.setAssignedTeams(blankToNull(assignedTeams));
        task.setAssignedEmployeeIds(blankToNull(assignedEmployeeIds));
        return taskRepository.save(task);
    }

    private static String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    /**
     * Sets or clears the due date of a task (US15)
     *
     * @param id      The ID of the task to update
     * @param dueDate The new due date, or null to clear it
     * @param role    The role of the user making the change
     * @return        The updated task
     * @throws RuntimeException        if the task does not exist
     * @throws ResponseStatusException 403 if the role is not admin or product owner,
     *                                 or 400 if the date is outside the sprint
     */
    public Task updateDueDate(Long id, LocalDate dueDate, String role) {
        if (!isAdmin(role) && !"PRODUCT_OWNER".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only admins or product owners can set a due date.");
        }
        Task task = getTaskById(id);
        checkDueDateInSprint(dueDate, task.getSprint());
        task.setDueDate(dueDate);
        return taskRepository.save(task);
    }

    /**
     * Updates the progress percentage of a task
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
     * Retrieves all tasks with a specific status
     */
    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatusOrderByPositionAscIdAsc(status);
    }

    /**
     * Retrieves all tasks that belongs to a sprint
     */
    public List<Task> getTasksBySprint(Long sprintId) {
        return taskRepository.findBySprintIdOrderByPositionAscIdAsc(sprintId);
    }

    /**
     * Deletes a task
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
     * Assigns a task to a user
     */
    public Task assignTask(Long taskId, Long userId) {
        Task task = getTaskById(taskId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        task.setAssignedUser(user);
        return taskRepository.save(task);
    }

    /**
     * Updates the status of a task
     */
    public Task updateStatus(Long taskId, TaskStatus status) {
        Task task = getTaskById(taskId);
        task.setStatus(status);
        return taskRepository.save(task);
    }

    /**
     * Changes the status of a task for a user with the given role (US17, US18)
     *
     * @param taskId The ID of the task to move
     * @param status The new status
     * @param role   The role of the user making the change
     * @return       The updated task
     * @throws RuntimeException        if the task does not exist
     * @throws ResponseStatusException 403 if a user completes or reopens a task,
     *                                 or 409 if a task is completed without being In Review
     */
    public Task updateStatus(Long taskId, TaskStatus status, String role) {
        Task task = getTaskById(taskId);
        checkStatusChange(task.getStatus(), status, role);
        task.setStatus(status);
        return taskRepository.save(task);
    }

    /**
     * Retrieves the board view and groups the tasks by the status
     */
    public Map<TaskStatus, List<Task>> getBoardView() {
        Map<TaskStatus, List<Task>> board = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            board.put(status, taskRepository.findByStatusOrderByPositionAscIdAsc(status));
        }
        return board;
    }

    /**
     * Retrieves all tasks that is for that specific team
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

    /**
     * Retrieves the tasks that carry a given tag (US14)
     *
     * @param tagName The tag name to filter by, ignoring upper and lower case
     * @return        A list of tasks with that tag
     */
    public List<Task> getTasksByTag(String tagName) {
        if (tagName == null || tagName.isBlank()) {
            return getAllTasks();
        }
        return taskRepository.findByTagsNameIgnoreCase(tagName.trim());
    }

    /**
     * Retrieves all tasks sorted by tag name (US14)
     *
     * @return A list of all tasks sorted by tag
     */
    public List<Task> getTasksSortedByTag() {
        Comparator<Task> byTag = Comparator.comparing(
                (Task t) -> firstTagName(t),
                Comparator.nullsLast(String::compareToIgnoreCase));
        Comparator<Task> byName = Comparator.comparing(
                (Task t) -> t.getName() == null ? "" : t.getName(),
                String::compareToIgnoreCase);
        return taskRepository.findAll().stream()
                .sorted(byTag.thenComparing(byName))
                .collect(Collectors.toList());
    }

    /**
     * @param task The task to read
     * @return     The first tag name
     */
    private static String firstTagName(Task task) {
        return task.getTags().stream()
                .map(Tag::getName)
                .filter(name -> name != null)
                .min(String::compareToIgnoreCase)
                .orElse(null);
    }

    /**
     * Checks whether its an admin
     *
     * @param role The role to check, may be null
     * @return     true if the role is ADMIN (ignoring case)
     */
    private static boolean isAdmin(String role) {
        return "ADMIN".equalsIgnoreCase(role);
    }

    /**
     *  only an admin can move a task
     *
     * @param current The task's current status
     * @param target  The requested status
     * @param role    The role of the user making the change
     * @throws ResponseStatusException 403 if a user completes or reopens a task,
     *                                 or 409 if the task is not In Review
     */
    private void checkStatusChange(TaskStatus current, TaskStatus target, String role) {
        if (target == null || target == current) {
            return;
        }
        if (target == TaskStatus.COMPLETED) {
            if (!isAdmin(role)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only an admin can mark a task as completed.");
            }
            if (current != TaskStatus.IN_REVIEW) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, NOT_IN_REVIEW_MESSAGE);
            }
        } else if (current == TaskStatus.COMPLETED && !isAdmin(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only an admin can reopen a completed task.");
        }
    }

    /**
     * Checks that a due date is inside a sprints start and end dates (US15).
     *
     * @param dueDate The due date to check, may be null
     * @param sprint  The sprint the task belongs to, may be null
     * @throws ResponseStatusException 400 if the date is before the sprint starts
     *                                 or after it ends
     */
    private void checkDueDateInSprint(LocalDate dueDate, Sprint sprint) {
        if (dueDate == null || sprint == null) {
            return;
        }
        LocalDate start = sprint.getStartDate();
        LocalDate end = sprint.getEndDate();
        if ((start != null && dueDate.isBefore(start)) || (end != null && dueDate.isAfter(end))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The due date must be within the sprint dates (" + start + " to " + end + ").");
        }
    }
}
