package webapplication.repository;

import webapplication.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SprintRepository extends JpaRepository<Sprint, Long> {

    // ✅ NEW — returns the most recent sprint with the given name (highest ID)
    Optional<Sprint> findTopByNameOrderByIdDesc(String name);
}