package webapplication.service;

import webapplication.model.ProductOwnerInvite;
import webapplication.repository.ProductOwnerInviteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages Product Owner invitation validation, creation, retrieval, and deletion.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class ProductOwnerInviteService {

    private final ProductOwnerInviteRepository inviteRepository;

    /**
     * Parameterized constructor with the required ProductOwnerInviteRepository dependency.
     *
     * @param inviteRepository The repository handling invite database operations
     */
    public ProductOwnerInviteService(ProductOwnerInviteRepository inviteRepository) {
        this.inviteRepository = inviteRepository;
    }

    /**
     * Validates and saves a Product Owner invite.
     *
     * @param invite                The invite to validate and save
     * @return                      The saved invite object
     * @throws IllegalArgumentException if the email is missing or has an invalid format
     * @throws RuntimeException         if the email has already been invited
     */
    public ProductOwnerInvite inviteProductOwner(ProductOwnerInvite invite) {
        if (invite == null || invite.getEmail() == null || invite.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = invite.getEmail().trim().toLowerCase();
        invite.setEmail(email);

        if (!email.matches("^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        if (inviteRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already invited");
        }

        return inviteRepository.save(invite);
    }

    /**
     * Retrieves all Product Owner invites.
     *
     * @return A list of all invites
     */
    public List<ProductOwnerInvite> getAllInvites() {
        return inviteRepository.findAll();
    }

    /**
     * Retrieves a single invite by its unique ID.
     *
     * @param id                The ID of the invite to retrieve
     * @return                  The invite object
     * @throws RuntimeException if no invite with the given ID exists
     */
    public ProductOwnerInvite getInviteById(Long id) {
        return inviteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invite not found"));
    }

    /**
     * Deletes an invite by its unique ID.
     *
     * @param id                The ID of the invite to delete
     * @throws RuntimeException if no invite with the given ID exists
     */
    public void deleteInvite(Long id) {
        if (!inviteRepository.existsById(id)) {
            throw new RuntimeException("Invite not found");
        }
        inviteRepository.deleteById(id);
    }
}