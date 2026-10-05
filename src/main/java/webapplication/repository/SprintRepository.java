package webapplication.repository;

import webapplication.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for performing CRUD operations on Sprint entities.
 * Provides a custom query to find the most recent sprint by name.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public interface SprintRepository extends JpaRepository<Sprint, Long> {

    /**
     * Finds the most recent sprint with the given name (highest ID).
     *
     * @param name The sprint name to search for
     * @return     An Optional containing the latest matching sprint, or empty otherwise
     */
    Optional<Sprint> findTopByNameOrderByIdDesc(String name);
}