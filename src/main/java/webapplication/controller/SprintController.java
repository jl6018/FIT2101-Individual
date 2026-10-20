package webapplication.controller;

import webapplication.model.Sprint;
import webapplication.service.SprintService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Exposes REST endpoints for managing sprints.
 * Handles creation, retrieval, status transitions, edits, and deletion.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin
public class SprintController {

    private final SprintService sprintService;

    /**
     * Constructor with the required SprintService dependency.
     *
     * @param sprintService The service handling sprint operations
     */
    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    /**
     * Retrieves all sprints.
     *
     * @return A list of all sprints
     */
    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintService.getAllSprints();
    }

    /**
     * Retrieves the most recent sprint with the given name.
     * Returns 200 with an empty body when no such sprint exists yet.
     *
     * @param name The name of the sprint
     * @return     200 with the latest matching sprint, or an empty 200 if none exists
     */
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestByName(@RequestParam String name) {
        try {
            return ResponseEntity.ok(sprintService.getLatestByName(name));
        } catch (RuntimeException e) {
            return ResponseEntity.ok().build();
        }
    }

    /**
     * Retrieves a single sprint by its ID.
     *
     * @param id The ID of the sprint
     * @return   The Sprint object
     */
    @GetMapping("/{id}")
    public Sprint getSprint(@PathVariable Long id) {
        return sprintService.getSprintById(id);
    }

    /**
     * Creates a new sprint with PLANNED status.
     *
     * @param sprint The Sprint object to create
     * @return       The saved Sprint object
     */
    @PostMapping
    public Sprint createSprint(@RequestBody Sprint sprint) {
        return sprintService.createSprint(sprint);
    }

    /**
     * Updates a PLANNED sprint's name, dates, and member count.
     * Only PLANNED sprints may be edited — ACTIVE and COMPLETED sprints
     * are locked. Returns 400 with an explanatory message on rejection.
     *
     * @param id                The ID of the sprint to update
     * @param sprint            The Sprint object containing the updated values
     * @return                  200 with the updated sprint, or 400 on error
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSprint(
            @PathVariable Long id,
            @RequestBody Sprint sprint) {
        try {
            return ResponseEntity.ok(sprintService.updateSprint(id, sprint));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Transitions a sprint to ACTIVE status.
     *
     * @param id The ID of the sprint to start
     * @return   The updated Sprint object
     */
    @PutMapping("/{id}/start")
    public Sprint startSprint(@PathVariable Long id) {
        return sprintService.startSprint(id);
    }

    /**
     * Transitions a sprint to COMPLETED status.
     *
     * @param id The ID of the sprint to complete
     * @return   The updated Sprint object
     */
    @PutMapping("/{id}/complete")
    public Sprint completeSprint(@PathVariable Long id) {
        return sprintService.completeSprint(id);
    }

    /**
     * Deletes a sprint along with all its tasks, time logs, and comments.
     *
     * @param id The ID of the sprint to delete
     */
    @DeleteMapping("/{id}")
    public void deleteSprint(@PathVariable Long id) {
        sprintService.deleteSprint(id);
    }
}