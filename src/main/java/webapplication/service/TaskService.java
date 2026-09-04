package webapplication.service;

import webapplication.model.Task;
import webapplication.model.TaskStatus;
import webapplication.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    // MUST HANDLE: Null status, negative progress, >100 progress
    public Task createTask(Task task) {
        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.PRODUCT_BACKLOG);
        }
        if (task.getProgress() < 0) {
            task.setProgress(0);
        } else if (task.getProgress() > 100) {
            task.setProgress(100);
        }
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task taskDetails) {
        Task task = getTaskById(id);
        task.setName(taskDetails.getName());
        task.setDescription(taskDetails.getDescription());
        task.setStatus(taskDetails.getStatus());
        task.setPriority(taskDetails.getPriority());
        task.setProgress(taskDetails.getProgress());
        task.setDueDate(taskDetails.getDueDate());
        task.setSprint(taskDetails.getSprint());
        task.setAssignedUser(taskDetails.getAssignedUser());
        return taskRepository.save(task);
    }

    // MUST THROW IllegalArgumentException for <0 or >100
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
}