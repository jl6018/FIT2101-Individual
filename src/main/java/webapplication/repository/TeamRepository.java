package webapplication.repository;

import webapplication.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for performing CRUD operations on Team entities.
 * Provides a custom query to find teams by name.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public interface TeamRepository extends JpaRepository<Team, Long> {

    /**
     * Finds a team by its name.
     *
     * @param name The team name to search for
     * @return     An Optional containing the team if found, or empty otherwise
     */
    Optional<Team> findByName(String name);
}