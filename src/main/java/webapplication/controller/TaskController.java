package webapplication.controller;

import webapplication.model.Task;
import webapplication.model.TaskStatus;
import webapplication.service.TaskService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    public Task getTask(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskService.createTask(task);
    }

    @PutMapping("/{id}")
    public Task updateTask(
            @PathVariable Long id,
            @RequestBody Task task) {

        return taskService.updateTask(id, task);
    }

    @PutMapping("/{id}/progress")
    public Task updateProgress(
            @PathVariable Long id,
            @RequestParam int progress) {

        return taskService.updateProgress(id, progress);
    }

    @GetMapping("/status/{status}")
    public List<Task> getTasksByStatus(
            @PathVariable TaskStatus status) {

        return taskService.getTasksByStatus(status);
    }

    @GetMapping("/sprint/{sprintId}")
    public List<Task> getTasksBySprint(
            @PathVariable Long sprintId) {

        return taskService.getTasksBySprint(sprintId);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }

    @GetMapping("/board")
    public Map<TaskStatus, List<Task>> getBoard() {
        return taskService.getBoardView();
    }

    @PutMapping("/{id}/assign")
    public Task assignTask(
            @PathVariable Long id,
            @RequestParam Long userId) {

        return taskService.assignTask(id, userId);
    }

    @PutMapping("/{id}/status")
    public Task updateStatus(
            @PathVariable Long id,
            @RequestParam TaskStatus status) {

        return taskService.updateStatus(id, status);
    }
}