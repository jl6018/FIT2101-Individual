package webapplication.model;

import jakarta.persistence.*;

@Entity
@Table(name = "product_owner_invites")
public class ProductOwnerInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    public ProductOwnerInvite() {
    }

    public ProductOwnerInvite(String email) {
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}