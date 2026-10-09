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

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintService.getAllSprints();
    }

    /**
     * Retrieves the most recent sprint with the given name.
     * Returns 200 with an empty body when no such sprint exists yet.
     */
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestByName(@RequestParam String name) {
        try {
            return ResponseEntity.ok(sprintService.getLatestByName(name));
        } catch (RuntimeException e) {
            return ResponseEntity.ok().build();
        }
    }

    @GetMapping("/{id}")
    public Sprint getSprint(@PathVariable Long id) {
        return sprintService.getSprintById(id);
    }

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

    @PutMapping("/{id}/start")
    public Sprint startSprint(@PathVariable Long id) {
        return sprintService.startSprint(id);
    }

    @PutMapping("/{id}/complete")
    public Sprint completeSprint(@PathVariable Long id) {
        return sprintService.completeSprint(id);
    }

    @DeleteMapping("/{id}")
    public void deleteSprint(@PathVariable Long id) {
        sprintService.deleteSprint(id);
    }
}