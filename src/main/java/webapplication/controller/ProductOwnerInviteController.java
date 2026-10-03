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

    @PostMapping
    public ResponseEntity<?> invite(@RequestBody ProductOwnerInvite invite) {
        try {
            return ResponseEntity.ok(inviteService.inviteProductOwner(invite));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<ProductOwnerInvite> getAll() {
        return inviteService.getAllInvites();
    }

    @GetMapping("/{id}")
    public ProductOwnerInvite getById(@PathVariable Long id) {
        return inviteService.getInviteById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        inviteService.deleteInvite(id);
    }
}