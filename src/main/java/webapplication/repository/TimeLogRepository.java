package webapplication.repository;

import webapplication.model.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {
    List<TimeLog> findByUserId(Long userId);
    List<TimeLog> findByTaskId(Long taskId);
    List<TimeLog> findByDateBetween(LocalDate start, LocalDate end);
}