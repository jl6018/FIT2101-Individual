package webapplication.controller;

import webapplication.model.Sprint;
import webapplication.service.SprintService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // ✅ NEW — board calls this so tabs reflect the newest sprint with that name
    // NOTE: must be declared BEFORE /{id} so "latest" isn't parsed as a Long
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestByName(@RequestParam String name) {
        try {
            return ResponseEntity.ok(sprintService.getLatestByName(name));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
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