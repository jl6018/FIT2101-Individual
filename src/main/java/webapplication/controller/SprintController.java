package webapplication.controller;

import webapplication.model.Sprint;
import webapplication.service.SprintService;
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
