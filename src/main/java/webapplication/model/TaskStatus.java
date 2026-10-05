package webapplication.model;

/**
 * Represents the workflow status of a task.
 * Follows the stages of a typical Scrum board.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

public enum TaskStatus {
    PRODUCT_BACKLOG,
    TO_DO,
    IN_PROGRESS,
    IN_REVIEW,
    COMPLETED
}