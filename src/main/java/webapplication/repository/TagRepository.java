package webapplication.repository;

import webapplication.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository for performing CRUD operations on {@link Tag} entities.
 *
 * <p>Provides a case-insensitive lookup by tag name so that tags differing
 * only in casing are treated as the same tag.</p>
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public interface TagRepository extends JpaRepository<Tag, Long> {

    /**
     * Finds a tag by its name, ignoring case.
     *
     * @param name The tag name to search for
     * @return     An {@link Optional} containing the matching tag, or empty if none exists
     */
    Optional<Tag> findByNameIgnoreCase(String name);
}