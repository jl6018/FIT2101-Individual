package webapplication.repository;

import webapplication.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository interface for performing CRUD operations on Project entities.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public interface ProjectRepository extends JpaRepository<Project, Long> {
}