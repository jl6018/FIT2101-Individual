package webapplication.service;

import webapplication.model.Tag;
import webapplication.model.Task;
import webapplication.repository.TagRepository;
import webapplication.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages tag creation, retrieval, and attachment to tasks.
 *
 * @author Symph Team
 * @version 17.0.16
 */
@Service
public class TagService {

    private final TagRepository tagRepository;
    private final TaskRepository taskRepository;

    public TagService(TagRepository tagRepository, TaskRepository taskRepository) {
        this.tagRepository = tagRepository;
        this.taskRepository = taskRepository;
    }

    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    /**
     * Adds a tag to a task, creating the tag if it doesn't already exist.
     * If the task already carries the tag, the task is returned unchanged.
     *
     * @param taskId  The ID of the task to tag
     * @param tagName The name of the tag (case-insensitive, stored lowercase)
     * @return        The updated Task object
     * @throws IllegalArgumentException if tagName is null or blank
     * @throws RuntimeException         if the task does not exist
     */
    public Task addTagToTask(Long taskId, String tagName) {
        if (tagName == null || tagName.isBlank()) {
            throw new IllegalArgumentException("Tag name is required");
        }

        String clean = tagName.trim().toLowerCase();

        Tag tag = tagRepository.findByNameIgnoreCase(clean)
                .orElseGet(() -> tagRepository.save(new Tag(clean)));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getTags().contains(tag)) {
            task.getTags().add(tag);
            return taskRepository.save(task);
        }
        return task;
    }

    /**
     * Removes a tag from a task.
     *
     * @param taskId The ID of the task
     * @param tagId  The ID of the tag to remove
     * @return       The updated Task object
     * @throws RuntimeException if the task does not exist
     */
    public Task removeTagFromTask(Long taskId, Long tagId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.getTags().removeIf(t -> t.getId().equals(tagId));
        return taskRepository.save(task);
    }
}