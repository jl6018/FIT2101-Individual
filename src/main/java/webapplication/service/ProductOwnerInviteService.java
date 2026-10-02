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

    public ProductOwnerInvite inviteProductOwner(ProductOwnerInvite invite) {
        if (invite.getEmail() == null || invite.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!invite.getEmail().matches("^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (inviteRepository.findByEmail(invite.getEmail()).isPresent()) {
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
        inviteRepository.deleteById(id);
    }
}