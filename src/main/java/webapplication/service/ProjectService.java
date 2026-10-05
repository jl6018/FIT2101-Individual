package webapplication.service;

import webapplication.model.Project;
import webapplication.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages project Create, Read, Update, and Delete operations.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    /**
     * Parameterized constructor with the required ProjectRepository dependency.
     *
     * @param projectRepository The repository handling project database operations
     */
    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    /**
     * Retrieves all projects from the database.
     *
     * @return A list of all projects
     */
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    /**
     * Retrieves a single project by its unique ID.
     *
     * @param id                The ID of the project to retrieve
     * @return                  The Project object
     * @throws RuntimeException if no project with the given ID exists
     */
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    /**
     * Creates a new project.
     *
     * @param project The Project object to save
     * @return        The saved Project object with its assigned ID
     */
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    /**
     * Updates an existing project's name, description, and team.
     *
     * @param id                The ID of the project to update
     * @param updatedProject    The Project object containing the updated details
     * @return                  The updated Project object
     * @throws RuntimeException if the project does not exist
     */
    public Project updateProject(Long id, Project updatedProject) {

        Project project = getProjectById(id);

        project.setName(updatedProject.getName());
        project.setDescription(updatedProject.getDescription());
        project.setTeam(updatedProject.getTeam());

        return projectRepository.save(project);
    }

    /**
     * Deletes a project from the database by its ID.
     *
     * @param id The ID of the project to delete
     */
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}