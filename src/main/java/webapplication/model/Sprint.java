package webapplication.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "sprints")
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private SprintStatus status;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    public Sprint() {
    }

    public Sprint(
            String name,
            LocalDate startDate,
            LocalDate endDate,
            SprintStatus status,
            Project project) {

        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.project = project;
    }

    public Long getId() {
        return id;
    }

    // ✅ ADD THIS METHOD
    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public SprintStatus getStatus() {
        return status;
    }

    public void setStatus(SprintStatus status) {
        this.status = status;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }
}