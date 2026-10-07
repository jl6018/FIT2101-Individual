package webapplication.service;

import webapplication.model.ProductOwnerInvite;
import webapplication.repository.ProductOwnerInviteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages Product Owner invitation validation, creation, retrieval,
 * deletion, and invitation checks.
 * Emails are normalized to lowercase and trimmed before being stored or
 * compared, so XX@x.com and xx@x.com are treated as the same address.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class ProductOwnerInviteService {

    private final ProductOwnerInviteRepository inviteRepository;

    public ProductOwnerInviteService(ProductOwnerInviteRepository inviteRepository) {
        this.inviteRepository = inviteRepository;
    }

    /**
     * Validates and saves a Product Owner invite.
     * The email is trimmed and lowercased before saving so duplicates
     * differing only by case are prevented. Only emails with a recognized
     * TLD are accepted.
     *
     * @param invite                The invite to validate and save
     * @return                      The saved invite object
     * @throws IllegalArgumentException if the email is missing or invalid
     * @throws RuntimeException         if the email has already been invited
     */
    public ProductOwnerInvite inviteProductOwner(ProductOwnerInvite invite) {
        if (invite == null || invite.getEmail() == null || invite.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = invite.getEmail().trim().toLowerCase();
        invite.setEmail(email);

        if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.(com|org|net|edu|gov|mil|io|co|my|sg|uk|us|info|biz|dev|app)$")) {
            throw new IllegalArgumentException("Invalid email format. Please use a recognized domain (e.g. user@gmail.com)");
        }

        if (inviteRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already invited");
        }

        return inviteRepository.save(invite);
    }

    public List<ProductOwnerInvite> getAllInvites() {
        return inviteRepository.findAll();
    }

    public ProductOwnerInvite getInviteById(Long id) {
        return inviteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invite not found"));
    }

    public void deleteInvite(Long id) {
        if (!inviteRepository.existsById(id)) {
            throw new RuntimeException("Invite not found");
        }
        inviteRepository.deleteById(id);
    }

    public boolean isInvited(String email) {
        if (email == null || email.isBlank()) return false;
        return inviteRepository.findByEmail(email.trim().toLowerCase()).isPresent();
    }
}