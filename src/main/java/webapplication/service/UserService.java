package webapplication.service;

import webapplication.model.Team;
import webapplication.model.User;
import webapplication.repository.TeamRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages user Create, Read, Update, Delete, login validation,
 * team assignment, and job title operations.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Service
public class UserService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    /**
     * Parameterized constructor with the required repository dependencies.
     *
     * @param userRepository The repository handling user database operations
     * @param teamRepository The repository handling team database operations
     */
    public UserService(UserRepository userRepository, TeamRepository teamRepository) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
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
     * Creates a new user if the email has not already been registered.
     *
     * @param user              The User object to save
     * @return                  The saved User object with its assigned ID
     * @throws RuntimeException if the email is already registered
     */
    public User createUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        return userRepository.save(user);
    }

    /**
     * Updates an existing user's name, email, and role.
     *
     * @param id                The ID of the user to update
     * @param updatedUser       The User object containing the updated details
     * @return                  The updated User object
     * @throws RuntimeException if the user does not exist
     */
    public User updateUser(Long id, User updatedUser) {
        User user = getUserById(id);
        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail());
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
     * Authenticates a user by checking their email and password.
     *
     * @param email     The email entered by the user
     * @param password  The password entered by the user
     * @return          The User object if credentials are valid, or null if invalid
     */
    public User login(String email, String password) {
        return userRepository.findByEmailAndPassword(email, password).orElse(null);
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