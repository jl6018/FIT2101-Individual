package webapplication.controller;

import webapplication.model.Team;
import webapplication.service.TeamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Exposes REST endpoints for managing teams and their members.
 * Handles creation, retrieval, member addition/removal, and deletion of teams.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@RestController
@RequestMapping("/api/teams")
@CrossOrigin
public class TeamController {

    private final TeamService teamService;

    /**
     * Parameterized constructor with the required TeamService dependency.
     *
     * @param teamService The service handling team business logic
     */
    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    /**
     * Retrieves all teams from the database.
     *
     * @return A list of all teams
     */
    @GetMapping
    public List<Team> getAllTeams() {
        return teamService.getAllTeams();
    }

    /**
     * Retrieves a single team by its unique ID.
     *
     * @param id The ID of the team to retrieve
     * @return   The Team object
     */
    @GetMapping("/{id}")
    public Team getTeam(@PathVariable Long id) {
        return teamService.getTeamById(id);
    }

    /**
     * Creates a new team.
     *
     * @param team The Team object to save
     * @return     The saved Team object with its assigned ID
     */
    @PostMapping
    public Team createTeam(@RequestBody Team team) {
        return teamService.createTeam(team);
    }

    /**
     * Adds a member to a team by team ID and user ID.
     *
     * @param teamId The ID of the team
     * @param userId The ID of the user to add
     * @return       The updated Team object
     */
    @PostMapping("/{teamId}/members/{userId}")
    public Team addMember(
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        return teamService.addMember(teamId, userId);
    }

    /**
     * Adds a member to a team by team name and user ID, with an optional job title.
     *
     * @param teamName The name of the team
     * @param userId   The ID of the user to add
     * @param body     An optional map containing the user's job title
     * @return         The updated Team object
     */
    @PostMapping("/by-name/{teamName}/members/{userId}")
    public Team addMemberByName(
            @PathVariable String teamName,
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body) {

        String jobTitle = (body != null) ? body.get("jobTitle") : null;
        return teamService.addMemberByName(teamName, userId, jobTitle);
    }

    /**
     * Removes a member from a team.
     *
     * @param teamId The ID of the team
     * @param userId The ID of the user to remove
     * @return       The updated Team object
     */
    @DeleteMapping("/{teamId}/members/{userId}")
    public Team removeMember(
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        return teamService.removeMember(teamId, userId);
    }

    /**
     * Deletes a team from the database by its ID.
     *
     * @param id The ID of the team to delete
     */
    @DeleteMapping("/{id}")
    public void deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
    }
}