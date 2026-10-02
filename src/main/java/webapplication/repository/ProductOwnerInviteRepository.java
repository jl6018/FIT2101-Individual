package webapplication.repository;

import webapplication.model.ProductOwnerInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductOwnerInviteRepository extends JpaRepository<ProductOwnerInvite, Long> {
    Optional<ProductOwnerInvite> findByEmail(String email);
}