package webapplication.service;

import webapplication.model.ProductOwnerInvite;
import webapplication.repository.ProductOwnerInviteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductOwnerInviteService {

    private final ProductOwnerInviteRepository inviteRepository;

    public ProductOwnerInviteService(ProductOwnerInviteRepository inviteRepository) {
        this.inviteRepository = inviteRepository;
    }

    /**
     * Validates and saves a Product Owner invite.
     * Throws IllegalArgumentException for invalid input.
     * Throws RuntimeException for duplicate email.
     */
    public ProductOwnerInvite inviteProductOwner(ProductOwnerInvite invite) {
        if (invite == null || invite.getEmail() == null || invite.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        // Normalize before checks so "Owner@x.com" and "owner@x.com" are treated the same
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
}