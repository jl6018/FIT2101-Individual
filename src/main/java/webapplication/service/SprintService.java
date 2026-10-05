package webapplication.service;

import webapplication.model.Sprint;
import webapplication.model.SprintStatus;
import webapplication.repository.SprintRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SprintService {

    private final SprintRepository sprintRepository;

    public SprintService(SprintRepository sprintRepository) {
        this.sprintRepository = sprintRepository;
    }

    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    public Sprint getSprintById(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
    }

    // ✅ NEW — latest sprint with a given name (used by the board tabs)
    public Sprint getLatestByName(String name) {
        return sprintRepository.findTopByNameOrderByIdDesc(name)
                .orElseThrow(() -> new RuntimeException("No sprint named '" + name + "'"));
    }

    public Sprint createSprint(Sprint sprint) {
        sprint.setStatus(SprintStatus.PLANNED);
        return sprintRepository.save(sprint);
    }

    public Sprint startSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.ACTIVE);
        return sprintRepository.save(sprint);
    }

    public Sprint completeSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.COMPLETED);
        return sprintRepository.save(sprint);
    }

    public void deleteSprint(Long id) {
        sprintRepository.deleteById(id);
    }
}