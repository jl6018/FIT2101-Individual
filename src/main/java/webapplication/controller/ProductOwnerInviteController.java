package webapplication.controller;

import webapplication.dto.AcceptInviteRequest;
import webapplication.model.ProductOwnerInvite;
import webapplication.service.ProductOwnerInviteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Exposes REST endpoints for managing Product Owner invitations.
 * Handles creation, retrieval, deletion, and invitation checks.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/invites")
@CrossOrigin
public class ProductOwnerInviteController {

    private final ProductOwnerInviteService inviteService;

    /**
     * Parameterized constructor with the required ProductOwnerInviteService dependency.
     *
     * @param inviteService The service handling invite business logic
     */
    public ProductOwnerInviteController(ProductOwnerInviteService inviteService) {
        this.inviteService = inviteService;
    }

    /**
     * Creates a new Product Owner invitation.
     *
     * @param invite            The invite object containing the email to invite
     * @return                  A ResponseEntity with the saved invite on success, or an error message on failure
     */
    @PostMapping
    public ResponseEntity<?> invite(@RequestBody ProductOwnerInvite invite) {
        try {
            ProductOwnerInvite saved = inviteService.inviteProductOwner(invite);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Retrieves all Product Owner invitations.
     *
     * @return A list of all invites
     */
    @GetMapping
    public List<ProductOwnerInvite> getAll() {
        return inviteService.getAllInvites();
    }

    /**
     * Checks whether an email has been invited as a Product Owner.
     * Used by the login page to gate PRODUCT_OWNER logins (US20 + US22).
     *
     * @param email The email address to check
     * @return      200 OK if invited, 404 Not Found if not
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkInvited(@RequestParam String email) {
        boolean invited = inviteService.isInvited(email);
        if (invited) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(404).body("Not invited");
    }

    /**
     * Checks an invite token from a registration link and returns the invited email,
     * so the register page can show it. Used by the register page (US20).
     *
     * @param token The token from the invite link
     * @return      200 with the email, or 404 if the token is invalid or already used
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        try {
            return ResponseEntity.ok(Map.of("email", inviteService.getEmailForToken(token)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Creates the Product Owner's account from an invite token.
     * This is the only way to register as a Product Owner.
     *
     * @param request The token, name and password
     * @return        200 with the new account's email, or 400 with an error message
     */
    @PostMapping("/accept")
    public ResponseEntity<?> accept(@RequestBody AcceptInviteRequest request) {
        try {
            var user = inviteService.acceptInvite(request.getToken(), request.getName(), request.getPassword());
            return ResponseEntity.ok(Map.of("email", user.getEmail()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Retrieves a single invitation by its unique ID.
     *
     * @param id                The ID of the invite to retrieve
     * @return                  A ResponseEntity with the invite on success, or an error message on failure
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inviteService.getInviteById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Deletes an invitation by its unique ID.
     *
     * @param id                The ID of the invite to delete
     * @return                  A ResponseEntity with no content on success, or an error message on failure
     */
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