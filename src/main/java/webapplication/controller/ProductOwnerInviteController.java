package webapplication.controller;

import webapplication.model.ProductOwnerInvite;
import webapplication.service.ProductOwnerInviteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invites")
@CrossOrigin
public class ProductOwnerInviteController {

    private final ProductOwnerInviteService inviteService;

    public ProductOwnerInviteController(ProductOwnerInviteService inviteService) {
        this.inviteService = inviteService;
    }

    /**
     * POST /api/invites
     * Body: { "email": "owner@company.com" }
     * Returns 200 with the saved invite, or 400 with an error message.
     */
    @PostMapping
    public ResponseEntity<?> invite(@RequestBody ProductOwnerInvite invite) {
        try {
            ProductOwnerInvite saved = inviteService.inviteProductOwner(invite);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            // Bad input — 400
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            // Duplicate / business rule — 400 with the message
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<ProductOwnerInvite> getAll() {
        return inviteService.getAllInvites();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inviteService.getInviteById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            inviteService.deleteInvite(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}