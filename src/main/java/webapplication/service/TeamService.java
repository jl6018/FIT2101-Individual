package webapplication.service;

import webapplication.model.Team;
import webapplication.model.User;
import webapplication.repository.TeamRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Manages team Create, Read, Update, member management and Delete operations.
 *
 * @author Lim Jia Li
 * @author Atifah
 * @version 17.0.16
 */

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    /**
     *  constructor
     *
     * @param teamRepository The repository handling team database operations
     * @param userRepository The repository handling user database operations
     */
    public TeamService(
            TeamRepository teamRepository,
            UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    /**
     * Retrieves all teams from the database
     *
     * @return A list of all teams
     */
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    /**
     * Retrieves a single team by its ID
     *
     * @param id                The ID of the team to retrieve
     * @return                  The Team object
     * @throws RuntimeException if no team with the given ID exists
     */
    public Team getTeamById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));
    }

    /**
     * Creates a new team
     *
     * @param team The Team object to save
     * @return     The saved Team object with its assigned ID
     */
    public Team createTeam(Team team) {
        return teamRepository.save(team);
    }

    /**
     * Updates an existing teams name
     *
     * @param id                The ID of the team to update
     * @param teamDetails       The Team object containing the updated details
     * @return                  The updated Team object
     * @throws RuntimeException if the team does not exist
     */
    public Team updateTeam(Long id, Team teamDetails) {
        Team team = getTeamById(id);
        team.setName(teamDetails.getName());
        return teamRepository.save(team);
    }

    /**
     * Adds a member to a team by team ID and user ID
     *
     * @param teamId            The ID of the team
     * @param userId            The ID of the user to add
     * @return                  The updated Team object
     * @throws RuntimeException if the team or user does not exist
     */
    public Team addMember(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!team.getMembers().contains(user)) {
            team.getMembers().add(user);
        }
        user.setTeam(team);
        userRepository.save(user);

        return teamRepository.save(team);
    }

    /**
     * Adds a member to a team by team name and user ID
     *
     * @param teamName          The name of the team
     * @param userId            The ID of the user to add
     * @param jobTitle          The user's job title
     * @return                  The updated or newly created Team object
     * @throws RuntimeException if the user does not exist
     */
    public Team addMemberByName(String teamName, Long userId, String jobTitle) {
        Team team = teamRepository.findByName(teamName)
                .orElseGet(() -> {
                    Team t = new Team();
                    t.setName(teamName);
                    return teamRepository.save(t);
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (jobTitle != null && !jobTitle.isBlank()) {
            user.setJobTitle(jobTitle);
        }

        if (!team.getMembers().contains(user)) {
            team.getMembers().add(user);
        }
        user.setTeam(team);
        userRepository.save(user);

        return teamRepository.save(team);
    }

    /**
     * Removes a member from a team and clears the user's team assignment
     *
     * @param teamId            The ID of the team
     * @param userId            The ID of the user to remove
     * @return                  The updated Team object
     * @throws RuntimeException if the team or user does not exist
     */
    public Team removeMember(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        team.getMembers().remove(user);
        user.setTeam(null);
        userRepository.save(user);

        return teamRepository.save(team);
    }

    /**
     * Deletes a team from the database by its ID
     *
     * @param id The ID of the team to delete
     */
    public void deleteTeam(Long id) {
        teamRepository.deleteById(id);
    }

    /** Teams that exist from the first start so the Members button has something to show. */
    public static final List<String> DEFAULT_TEAMS = List.of("Team Alpha", "Team Beta", "Team Gamma");

    /**
     * Creates the default teams if they are missing
     */
    @Transactional
    public void seedDefaults() {
        for (String name : DEFAULT_TEAMS) {
            if (teamRepository.findByName(name).isEmpty()) {
                teamRepository.save(new Team(name));
            }
        }
        Team first = teamRepository.findByName(DEFAULT_TEAMS.get(0)).orElse(null);
        if (first == null) {
            return;
        }
        for (User user : userRepository.findAll()) {
            if ("EMPLOYEE".equals(user.getRole()) && user.getTeam() == null) {
                if (!first.getMembers().contains(user)) {
                    first.getMembers().add(user);
                }
                user.setTeam(first);
                userRepository.save(user);
            }
        }
        teamRepository.save(first);
    }
}
