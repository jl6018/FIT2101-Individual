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

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;

    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository,
                       SprintRepository sprintRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.sprintRepository = sprintRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    public Task createTask(Task task) {
        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.PRODUCT_BACKLOG);
        }
        if (task.getProgress() < 0) {
            task.setProgress(0);
        } else if (task.getProgress() > 100) {
            task.setProgress(100);
        }

        // ✅ Resolve sprint from DB if present
        if (task.getSprint() != null && task.getSprint().getId() != null) {
            Sprint sprint = sprintRepository.findById(task.getSprint().getId())
                    .orElse(null);
            task.setSprint(sprint);
        } else {
            task.setSprint(null);
        }

        return taskRepository.save(task);
    }

    // ✅ NULL-SAFE update — prevents 500 errors when frontend sends partial data
    public Task updateTask(Long id, Task taskDetails) {
        Task task = getTaskById(id);

        if (taskDetails.getName() != null) task.setName(taskDetails.getName());
        if (taskDetails.getDescription() != null) task.setDescription(taskDetails.getDescription());
        if (taskDetails.getStatus() != null) task.setStatus(taskDetails.getStatus());
        if (taskDetails.getPriority() != null) task.setPriority(taskDetails.getPriority());
        if (taskDetails.getProgress() != 0) task.setProgress(taskDetails.getProgress());
        if (taskDetails.getDueDate() != null) task.setDueDate(taskDetails.getDueDate());

        // ✅ Resolve sprint from DB instead of passing a detached entity
        if (taskDetails.getSprint() != null && taskDetails.getSprint().getId() != null) {
            Sprint sprint = sprintRepository.findById(taskDetails.getSprint().getId())
                    .orElse(null);
            task.setSprint(sprint);
        }

        if (taskDetails.getAssignedUser() != null) task.setAssignedUser(taskDetails.getAssignedUser());
        if (taskDetails.getAssignedTeams() != null) task.setAssignedTeams(taskDetails.getAssignedTeams());
        if (taskDetails.getAssignedEmployeeIds() != null) task.setAssignedEmployeeIds(taskDetails.getAssignedEmployeeIds());
        if (taskDetails.getEstimateHours() != 0) task.setEstimateHours(taskDetails.getEstimateHours());

        return taskRepository.save(task);
    }

    public Task updateProgress(Long id, int progress) {
        if (progress < 0 || progress > 100) {
            throw new IllegalArgumentException("Progress must be between 0 and 100");
        }
        Task task = getTaskById(id);
        task.setProgress(progress);
        return taskRepository.save(task);
    }

    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatus(status);
    }

    public List<Task> getTasksBySprint(Long sprintId) {
        return taskRepository.findBySprintId(sprintId);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    public Task assignTask(Long taskId, Long userId) {
        Task task = getTaskById(taskId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        task.setAssignedUser(user);
        return taskRepository.save(task);
    }

    public Task updateStatus(Long taskId, TaskStatus status) {
        Task task = getTaskById(taskId);
        task.setStatus(status);
        return taskRepository.save(task);
    }

    public Map<TaskStatus, List<Task>> getBoardView() {
        Map<TaskStatus, List<Task>> board = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            board.put(status, taskRepository.findByStatus(status));
        }
        return board;
    }

    public List<Task> getTasksByTeam(String teamName) {
        List<Long> teamMemberIds = userRepository.findAll().stream()
                .filter(u -> u.getTeam() != null && teamName.equals(u.getTeam().getName()))
                .map(User::getId)
                .collect(Collectors.toList());

        return taskRepository.findAll().stream()
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