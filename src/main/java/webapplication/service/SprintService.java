package webapplication.service;

import webapplication.model.Sprint;
import webapplication.model.SprintStatus;
import webapplication.repository.SprintRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages sprint Create, Read, status transition, and Delete operations.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class SprintService {

    private final SprintRepository sprintRepository;

    /**
     * Parameterized constructor with the required SprintRepository dependency.
     *
     * @param sprintRepository The repository handling sprint database operations
     */
    public SprintService(SprintRepository sprintRepository) {
        this.sprintRepository = sprintRepository;
    }

    /**
     * Retrieves all sprints from the database.
     *
     * @return A list of all sprints
     */
    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    /**
     * Retrieves a single sprint by its unique ID.
     *
     * @param id                The ID of the sprint to retrieve
     * @return                  The Sprint object
     * @throws RuntimeException if no sprint with the given ID exists
     */
    public Sprint getSprintById(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
    }

    /**
     * Retrieves the most recent sprint with the given name.
     *
     * @param name              The name of the sprint to search for
     * @return                  The latest matching Sprint object
     * @throws RuntimeException if no sprint with the given name exists
     */
    public Sprint getLatestByName(String name) {
        return sprintRepository.findTopByNameOrderByIdDesc(name)
                .orElseThrow(() -> new RuntimeException("No sprint named '" + name + "'"));
    }

    /**
     * Creates a new sprint with a PLANNED status.
     *
     * @param sprint The Sprint object to save
     * @return       The saved Sprint object with its assigned ID
     */
    public Sprint createSprint(Sprint sprint) {
        sprint.setStatus(SprintStatus.PLANNED);
        return sprintRepository.save(sprint);
    }

    /**
     * Starts a sprint by transitioning its status to ACTIVE.
     *
     * @param id                The ID of the sprint to start
     * @return                  The updated Sprint object
     * @throws RuntimeException if the sprint does not exist
     */
    public Sprint startSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.ACTIVE);
        return sprintRepository.save(sprint);
    }

    /**
     * Completes a sprint by transitioning its status to COMPLETED.
     *
     * @param id                The ID of the sprint to complete
     * @return                  The updated Sprint object
     * @throws RuntimeException if the sprint does not exist
     */
    public Sprint completeSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(SprintStatus.COMPLETED);
        return sprintRepository.save(sprint);
    }

    /**
     * Deletes a sprint from the database by its ID.
     *
     * @param id The ID of the sprint to delete
     */
    public void deleteSprint(Long id) {
        sprintRepository.deleteById(id);
    }
}