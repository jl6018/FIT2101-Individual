package webapplication.controller;

import webapplication.model.Task;
import webapplication.model.TaskStatus;
import webapplication.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Exposes REST endpoints for managing tasks.
 * Handles creation, retrieval, updates, assignment, board views, and deletion of tasks.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskController {

    private final TaskService taskService;

    /**
     * Parameterized constructor with the required TaskService dependency.
     *
     * @param taskService The service handling task business logic
     */
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Retrieves all tasks ordered by board position.
     *
     * @return A list of all tasks
     */
    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    /**
     * Retrieves a single task by its unique ID.
     *
     * @param id                The ID of the task to retrieve
     * @return                  A ResponseEntity with the task on success, or an error message on failure
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTask(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(taskService.getTaskById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Creates a new task.
     *
     * @param task The Task object to save
     * @return     The saved Task object with its assigned ID
     */
    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskService.createTask(task);
    }

    /**
     * Updates an existing task's details.
     *
     * @param id                The ID of the task to update
     * @param task              The Task object containing the updated details
     * @return                  A ResponseEntity with the updated task, or an error message on failure
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @RequestBody Task task) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, task));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Updates the progress percentage of a task.
     *
     * @param id                The ID of the task to update
     * @param progress          The progress value between 0 and 100
     * @return                  A ResponseEntity with the updated task, or an error message on failure
     */
    @PutMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(
            @PathVariable Long id,
            @RequestParam int progress) {
        try {
            return ResponseEntity.ok(taskService.updateProgress(id, progress));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Retrieves all tasks with a specific status.
     *
     * @param status The TaskStatus to filter by
     * @return       A list of tasks matching the given status
     */
    @GetMapping("/status/{status}")
    public List<Task> getTasksByStatus(@PathVariable TaskStatus status) {
        return taskService.getTasksByStatus(status);
    }

    /**
     * Retrieves all tasks belonging to a specific sprint.
     *
     * @param sprintId The ID of the sprint
     * @return         A list of tasks in the given sprint
     */
    @GetMapping("/sprint/{sprintId}")
    public List<Task> getTasksBySprint(@PathVariable Long sprintId) {
        return taskService.getTasksBySprint(sprintId);
    }

    /**
     * Deletes a task from the database by its ID.
     *
     * @param id The ID of the task to delete
     */
    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }

    /**
     * Retrieves the board view grouping tasks by their status.
     *
     * @return A map of TaskStatus to lists of tasks
     */
    @GetMapping("/board")
    public Map<TaskStatus, List<Task>> getBoard() {
        return taskService.getBoardView();
    }

    /**
     * Assigns a task to a specific user.
     *
     * @param id                The ID of the task to assign
     * @param userId            The ID of the user to assign the task to
     * @return                  A ResponseEntity with the updated task, or an error message on failure
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignTask(
            @PathVariable Long id,
            @RequestParam Long userId) {
        try {
            return ResponseEntity.ok(taskService.assignTask(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Updates the status of a task.
     *
     * @param id                The ID of the task to update
     * @param status            The new TaskStatus
     * @return                  A ResponseEntity with the updated task, or an error message on failure
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam TaskStatus status) {
        try {
            return ResponseEntity.ok(taskService.updateStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Retrieves all tasks belonging to a specific team.
     *
     * @param teamName The name of the team
     * @return         A list of tasks assigned to the given team
     */
    @GetMapping("/team/{teamName}")
    public List<Task> getTasksByTeam(@PathVariable String teamName) {
        return taskService.getTasksByTeam(teamName);
    }
}