package webapplication.controller;

import webapplication.model.Task;
import webapplication.model.TaskStatus;
import webapplication.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Exposes endpoints for managing tasks.
 *
 * @author Lim Jia Li
 * @author Atifah (US14 to US18)
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskController {

    private final TaskService taskService;

    /**
     * Request body for changing a task's due date.
     *
     * @param dueDate The new due date
     */
    public record DueDateRequest(LocalDate dueDate) { }

    /**
     * Constructor with the required TaskService dependency.
     *
     * @param taskService The service handling task operations
     */
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Retrieves all tasks.
     *
     * @return A list of all tasks
     */
    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    /**
     * Retrieves a single task by its ID.
     *
     * @param id The ID of the task
     * @return   The Task object, or 404 if not found
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
     * Creates a task.
     *
     * @param task The task to create
     * @return     The created task, or 409 or 400 with a message if a rule is broken
     */
    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task) {
        if (task.getStatus() == TaskStatus.COMPLETED) {
            return ResponseEntity.status(409)
                    .body("A task must be In Review before it can be completed.");
        }
        try {
            return ResponseEntity.ok(taskService.createTask(task));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    /**
     * Updates a task.
     *
     * @param id   The ID of the task to update
     * @param task The updated task details
     * @param role The caller's role from the X-Role header
     * @return     The updated task, or 403 or 409 with a message if a rule is broken,
     *             or 404 if the task does not exist
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @RequestBody Task task,
            @RequestHeader(value = "X-Role", required = false) String role) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, task, role));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Saves who a task is assigned to.
     *
     * @param id   The ID of the task to update
     * @param body The request body
     * @return     The updated task, or 404 if the task does not exist
     */
    @PutMapping("/{id}/assignees")
    public ResponseEntity<?> updateAssignees(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(taskService.updateAssignees(
                    id, body.get("assignedTeams"), body.get("assignedEmployeeIds")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Sets or clears a task's due date (US15).
     *
     * @param id      The ID of the task to update
     * @param request The request body holding the new due date, or null to clear it
     * @param role    The caller's role from the X-Role header
     * @return        The updated task, or 403 or 400 with a message if a rule is broken,
     *                or 404 if the task does not exist
     */
    @PatchMapping("/{id}/due-date")
    public ResponseEntity<?> updateDueDate(
            @PathVariable Long id,
            @RequestBody DueDateRequest request,
            @RequestHeader(value = "X-Role", required = false) String role) {
        try {
            return ResponseEntity.ok(taskService.updateDueDate(id, request.dueDate(), role));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Retrieves the tasks that have the given tag.
     *
     * @param tagName The tag name to filter by, ignoring case
     * @return        A list of tasks with that tag
     */
    @GetMapping("/tag/{tagName}")
    public List<Task> getTasksByTag(@PathVariable String tagName) {
        return taskService.getTasksByTag(tagName);
    }

    /**
     * Retrieves all tasks sorted by tag name, with untagged tasks last (US14).
     *
     * @return A list of all tasks sorted by tag
     */
    @GetMapping("/sorted-by-tag")
    public List<Task> getTasksSortedByTag() {
        return taskService.getTasksSortedByTag();
    }

    /**
     * Updates a task's progress percentage.
     *
     * @param id       The ID of the task to update
     * @param progress The new progress value
     * @return         The updated task, or 400 or 404 with a message on failure
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
     * Retrieves all tasks with the given status.
     *
     * @param status The status to filter by
     * @return       A list of tasks with that status
     */
    @GetMapping("/status/{status}")
    public List<Task> getTasksByStatus(@PathVariable TaskStatus status) {
        return taskService.getTasksByStatus(status);
    }

    /**
     * Retrieves all tasks belonging to a sprint.
     *
     * @param sprintId The ID of the sprint
     * @return         A list of tasks in that sprint
     */
    @GetMapping("/sprint/{sprintId}")
    public List<Task> getTasksBySprint(@PathVariable Long sprintId) {
        return taskService.getTasksBySprint(sprintId);
    }

    /**
     * Deletes a task. Only an ADMIN caller may do this.
     *
     * @param id   The ID of the task to delete
     * @param role The caller's role from the X-Role header
     * @return     204 No Content on success, 403 if not an admin, 409 if deletion fails
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(
            @PathVariable Long id,
            @RequestHeader(value = "X-Role", required = false) String role) {

        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Only admins can delete tasks");
        }

        try {
            taskService.deleteTask(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    /**
     * Retrieves the board view of tasks grouped by status.
     *
     * @return A map of TaskStatus to lists of tasks
     */
    @GetMapping("/board")
    public Map<TaskStatus, List<Task>> getBoard() {
        return taskService.getBoardView();
    }

    /**
     * Assigns a task to a user.
     *
     * @param id     The ID of the task
     * @param userId The ID of the user to assign
     * @return       The updated task, or 404 if the task does not exist
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
     * Moves a task to a new status.
     *
     * @param id     The ID of the task to move
     * @param status The new status
     * @param role   The caller's role from the X-Role header
     * @return       The updated task, or 403 or 409 with a message if a rule is broken,
     *               or 404 if the task does not exist
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam TaskStatus status,
            @RequestHeader(value = "X-Role", required = false) String role) {
        try {
            return ResponseEntity.ok(taskService.updateStatus(id, status, role));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Retrieves all tasks assigned to a team.
     *
     * @param teamName The name of the team
     * @return         A list of tasks assigned to that team
     */
    @GetMapping("/team/{teamName}")
    public List<Task> getTasksByTeam(@PathVariable String teamName) {
        return taskService.getTasksByTeam(teamName);
    }
}