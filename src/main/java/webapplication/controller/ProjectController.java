package webapplication.controller;

import webapplication.model.Project;
import webapplication.service.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Exposes REST endpoints for managing projects.
 * Handles creation, retrieval, update, and deletion of projects.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/projects")
@CrossOrigin
public class ProjectController {

    private final ProjectService projectService;

    /**
     * Parameterized constructor with the required ProjectService dependency.
     *
     * @param projectService The service handling project business logic
     */
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Retrieves all projects from the database.
     *
     * @return A list of all projects
     */
    @GetMapping
    public List<Project> getAllProjects() {
        return projectService.getAllProjects();
    }

    /**
     * Retrieves a single project by its unique ID.
     *
     * @param id The ID of the project to retrieve
     * @return   The Project object
     */
    @GetMapping("/{id}")
    public Project getProject(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    /**
     * Creates a new project.
     *
     * @param project The Project object to save
     * @return        The saved Project object with its assigned ID
     */
    @PostMapping
    public Project createProject(@RequestBody Project project) {
        return projectService.createProject(project);
    }

    /**
     * Updates an existing project's name, description, and team.
     *
     * @param id      The ID of the project to update
     * @param project The Project object containing the updated details
     * @return        The updated Project object
     */
    @PutMapping("/{id}")
    public Project updateProject(
            @PathVariable Long id,
            @RequestBody Project project) {

        return projectService.updateProject(id, project);
    }

    /**
     * Deletes a project from the database by its ID.
     *
     * @param id The ID of the project to delete
     */
    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
    }
}