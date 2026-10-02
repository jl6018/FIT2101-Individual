import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import webapplication.Application;
import webapplication.model.ProductOwnerInvite;
import webapplication.repository.ProductOwnerInviteRepository;
import webapplication.service.ProductOwnerInviteService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ProductOwnerInviteService.
 * Tests invite logic, duplicate prevention, and email validation.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@SpringBootTest(classes = Application.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:invitedb",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ProductOwnerInviteServiceTest {

    @Autowired
    private ProductOwnerInviteService inviteService;

    @Autowired
    private ProductOwnerInviteRepository inviteRepository;

    private ProductOwnerInvite testInvite;

    @BeforeEach
    void setUp() {
        inviteRepository.deleteAll();

        testInvite = new ProductOwnerInvite();
        testInvite.setEmail("owner@example.com");
    }

    /**
     * Tests that inviting a valid email saves the invite and assigns an ID.
     */
    @Test
    void testInviteProductOwner_Success() {
        ProductOwnerInvite created = inviteService.inviteProductOwner(testInvite);

        assertNotNull(created.getId());
        assertEquals("owner@example.com", created.getEmail());
    }

    /**
     * Tests that inviting with an invalid email throws an exception.
     */
    @Test
    void testInviteProductOwner_InvalidEmail_ThrowsException() {
        ProductOwnerInvite invalid = new ProductOwnerInvite();
        invalid.setEmail("notanemail");

        assertThrows(IllegalArgumentException.class, () ->
                inviteService.inviteProductOwner(invalid));
    }

    /**
     * Tests that inviting with an empty email throws an exception.
     */
    @Test
    void testInviteProductOwner_EmptyEmail_ThrowsException() {
        ProductOwnerInvite empty = new ProductOwnerInvite();
        empty.setEmail("");

        assertThrows(IllegalArgumentException.class, () ->
                inviteService.inviteProductOwner(empty));
    }

    /**
     * Tests that inviting the same email twice throws an exception.
     */
    @Test
    void testInviteProductOwner_Duplicate_ThrowsException() {
        inviteService.inviteProductOwner(testInvite);

        ProductOwnerInvite duplicate = new ProductOwnerInvite();
        duplicate.setEmail("owner@example.com");

        assertThrows(RuntimeException.class, () ->
                inviteService.inviteProductOwner(duplicate));
    }

    /**
     * Tests that retrieving all invites returns the correct count.
     */
    @Test
    void testGetAllInvites_Success() {
        inviteService.inviteProductOwner(testInvite);

        ProductOwnerInvite second = new ProductOwnerInvite();
        second.setEmail("owner2@example.com");
        inviteService.inviteProductOwner(second);

        List<ProductOwnerInvite> invites = inviteService.getAllInvites();

        assertNotNull(invites);
        assertEquals(2, invites.size());
    }

    /**
     * Tests that retrieving an invite by ID returns the correct invite.
     */
    @Test
    void testGetInviteById_Success() {
        ProductOwnerInvite saved = inviteService.inviteProductOwner(testInvite);

        ProductOwnerInvite found = inviteService.getInviteById(saved.getId());

        assertNotNull(found);
        assertEquals(saved.getId(), found.getId());
        assertEquals("owner@example.com", found.getEmail());
    }

    /**
     * Tests that retrieving a non-existent invite throws an exception.
     */
    @Test
    void testGetInviteById_NotFound_ThrowsException() {
        assertThrows(RuntimeException.class, () ->
                inviteService.getInviteById(999L));
    }

    /**
     * Tests that deleting an invite removes it from the database.
     */
    @Test
    void testDeleteInvite_Success() {
        ProductOwnerInvite saved = inviteService.inviteProductOwner(testInvite);

        inviteService.deleteInvite(saved.getId());

        assertThrows(RuntimeException.class, () ->
                inviteService.getInviteById(saved.getId()));
    }
}