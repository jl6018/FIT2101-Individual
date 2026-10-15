package webapplication.repository;

import webapplication.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for performing CRUD operations on User entities.
 * Provides custom queries for finding users by email and reset token.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address.
     *
     * @param email The email address to search for
     * @return      An Optional containing the user if found, or empty otherwise
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds a user by their active password-reset token.
     *
     * @param resetToken The reset token to search for
     * @return           An Optional containing the user if found, or empty otherwise
     */
    Optional<User> findByResetToken(String resetToken);
}