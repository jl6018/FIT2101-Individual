package webapplication.service;

import webapplication.model.Team;
import webapplication.model.User;
import webapplication.repository.TeamRepository;
import webapplication.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages user Create, Read, Update, Delete, login validation,
 * team assignment, and job title operations.
 * Emails are normalized to lowercase and trimmed before being stored or
 * compared, so XX@x.com and xx@x.com are treated as the same address.
 * Passwords are hashed with BCrypt before being stored; login compares
 * the raw password against the stored hash.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Parameterized constructor with the required repository dependencies
     * and the password encoder.
     *
     * @param userRepository  The repository handling user database operations
     * @param teamRepository  The repository handling team database operations
     * @param passwordEncoder The BCrypt password encoder
     */
    public UserService(UserRepository userRepository,
                       TeamRepository teamRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Retrieves all users from the database.
     *
     * @return A list of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Retrieves a single user by their unique ID.
     *
     * @param id                The ID of the user to retrieve
     * @return                  The User object
     * @throws RuntimeException if no user with the given ID exists
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Creates a new user. The email is normalized to lowercase and trimmed
     * before the duplicate check, so XX@x.com and xx@x.com are treated as
     * the same email address. The password is hashed with BCrypt before
     * being persisted.
     *
     * @param user              The User object to save
     * @return                  The saved User object with its assigned ID
     * @throws RuntimeException if the email is already registered
     */
    public User createUser(User user) {
        String normalizedEmail = user.getEmail().trim().toLowerCase();
        user.setEmail(normalizedEmail);

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /**
     * Updates an existing user's name, email, and role.
     * Password is not updated here — use a dedicated password-change
     * endpoint if that becomes a requirement.
     *
     * @param id                The ID of the user to update
     * @param updatedUser       The User object containing the updated details
     * @return                  The updated User object
     * @throws RuntimeException if the user does not exist
     */
    public User updateUser(Long id, User updatedUser) {
        User user = getUserById(id);
        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail().trim().toLowerCase());
        user.setRole(updatedUser.getRole());
        return userRepository.save(user);
    }

    /**
     * Deletes a user from the database by their ID.
     *
     * @param id The ID of the user to delete
     */
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Authenticates a user by email and password. The email is normalized
     * the same way as at registration, so casing doesn't matter.
     * The supplied password is compared against the stored BCrypt hash.
     *
     * @param email     The email entered by the user
     * @param password  The raw password entered by the user
     * @return          The User object if credentials are valid, or null if invalid
     */
    public User login(String email, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .orElse(null);
    }

    /**
     * Updates a user's team assignment. Passing a blank team name clears the team.
     *
     * @param id                The ID of the user to update
     * @param teamName          The name of the team to assign
     * @return                  The updated User object
     * @throws RuntimeException if the user or team does not exist
     */
    public User updateTeam(Long id, String teamName) {
        User user = getUserById(id);
        if (teamName == null || teamName.isBlank()) {
            user.setTeam(null);
        } else {
            Team team = teamRepository.findByName(teamName)
                    .orElseThrow(() -> new RuntimeException("Team not found: " + teamName));
            user.setTeam(team);
        }
        return userRepository.save(user);
    }

    /**
     * Updates a user's job title.
     *
     * @param id                The ID of the user to update
     * @param jobTitle          The new job title
     * @return                  The updated User object
     * @throws RuntimeException if the user does not exist
     */
    public User updateJobTitle(Long id, String jobTitle) {
        User user = getUserById(id);
        user.setJobTitle(jobTitle);
        return userRepository.save(user);
    }
}