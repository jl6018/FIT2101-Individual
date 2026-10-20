package webapplication.repository;

import webapplication.model.ProductOwnerInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for performing CRUD operations on ProductOwnerInvite entities.
 * Provides a custom query to find invites by email.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public interface ProductOwnerInviteRepository extends JpaRepository<ProductOwnerInvite, Long> {

    /**
     * Finds an invite by its email address.
     *
     * @param email The email address to search for
     * @return      An Optional containing the invite if found, or empty otherwise
     */
    Optional<ProductOwnerInvite> findByEmail(String email);

    /**
     * Finds an invite by its one-time registration token.
     *
     * @param token The token from the invite link
     * @return      An Optional containing the invite if found, or empty otherwise
     */
    Optional<ProductOwnerInvite> findByToken(String token);
}