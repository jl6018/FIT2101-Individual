package webapplication.model;

import jakarta.persistence.*;

/**
 * Represents a tag that can be attached to tasks.
 * Tags categorise work by area (e.g. frontend, backend, urgent).
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@Entity
@Table(name = "tags")
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String name;

    /**
     * No-argument constructor required by JPA.
     */
    public Tag() {}

    /**
     * Constructs a new Tag with the given name.
     *
     * @param name The tag name
     */
    public Tag(String name) {
        this.name = name;
    }

    /**
     * Returns the tag's unique ID.
     *
     * @return The tag ID
     */
    public Long getId() { return id; }

    /**
     * Sets the tag's unique ID.
     *
     * @param id The tag ID
     */
    public void setId(Long id) { this.id = id; }

    /**
     * Returns the tag name.
     *
     * @return The tag name
     */
    public String getName() { return name; }

    /**
     * Sets the tag name.
     *
     * @param name The tag name
     */
    public void setName(String name) { this.name = name; }

    /**
     * Compares this tag to another object for equality based on ID.
     *
     * @param o The object to compare against
     * @return  {@code true} if both tags share the same non-null ID
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Tag)) return false;
        Tag other = (Tag) o;
        return id != null && id.equals(other.id);
    }

    /**
     * Returns the hash code of this tag based on its ID.
     *
     * @return The hash code, or {@code 0} if the ID is null
     */
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}