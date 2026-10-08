package webapplication.controller;

import webapplication.model.Sprint;
import webapplication.service.SprintService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Exposes REST endpoints for managing sprints.
 * Handles creation, retrieval, status transitions, and deletion of sprints.
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
     * Parameterized constructor with the required SprintService dependency.
     *
     * @param sprintService The service handling sprint business logic
     */
    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    /**
     * Retrieves all sprints from the database.
     *
     * @return A list of all sprints
     */
    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintService.getAllSprints();
    }

    /**
     * Retrieves the most recent sprint with the given name.
     * Used by the board page so tabs reflect the newest sprint with that name.
     *
     * If no sprint with that name exists yet, this returns 200 with an empty
     * body (rather than 404) so the browser does not log a red console error
     * on first load before any sprint has been created.
     *
     * @param name              The name of the sprint to search for
     * @return                  A ResponseEntity with the latest matching sprint,
     *                          or an empty 200 response when none exists
     */
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestByName(@RequestParam String name) {
        try {
            return ResponseEntity.ok(sprintService.getLatestByName(name));
        } catch (RuntimeException e) {
            // No sprint with this name yet — return 200 with an empty body
            // instead of 404 so the frontend's initial load stays quiet.
            return ResponseEntity.ok().build();
        }
    }

    /**
     * Retrieves a single sprint by its unique ID.
     *
     * @param id The ID of the sprint to retrieve
     * @return   The Sprint object
     */
    @GetMapping("/{id}")
    public Sprint getSprint(@PathVariable Long id) {
        return sprintService.getSprintById(id);
    }

    /**
     * Creates a new sprint with a PLANNED status.
     *
     * @param sprint The Sprint object to save
     * @return       The saved Sprint object with its assigned ID
     */
    @PostMapping
    public Sprint createSprint(@RequestBody Sprint sprint) {
        return sprintService.createSprint(sprint);
    }

    /**
     * Starts a sprint by transitioning its status to ACTIVE.
     *
     * @param id The ID of the sprint to start
     * @return   The updated Sprint object
     */
    @PutMapping("/{id}/start")
    public Sprint startSprint(@PathVariable Long id) {
        return sprintService.startSprint(id);
    }

    /**
     * Completes a sprint by transitioning its status to COMPLETED.
     *
     * @param id The ID of the sprint to complete
     * @return   The updated Sprint object
     */
    @PutMapping("/{id}/complete")
    public Sprint completeSprint(@PathVariable Long id) {
        return sprintService.completeSprint(id);
    }

    /**
     * Deletes a sprint from the database by its ID.
     *
     * @param id The ID of the sprint to delete
     */
    @DeleteMapping("/{id}")
    public void deleteSprint(@PathVariable Long id) {
        sprintService.deleteSprint(id);
    }
}