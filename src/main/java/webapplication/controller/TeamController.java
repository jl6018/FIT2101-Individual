package webapplication.controller;

import webapplication.model.Team;
import webapplication.service.TeamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<Team> getAllTeams() {
        return teamService.getAllTeams();
    }

    @GetMapping("/{id}")
    public Team getTeam(@PathVariable Long id) {
        return teamService.getTeamById(id);
    }

    @PostMapping
    public Team createTeam(@RequestBody Team team) {
        return teamService.createTeam(team);
    }

    @PostMapping("/{teamId}/members/{userId}")
    public Team addMember(
            @PathVariable Long teamId,
            @PathVariable Long userId) {

        return teamService.addMember(teamId, userId);
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public Team removeMember(
            @PathVariable Long teamId,
            @PathVariable Long userId) {

        return teamService.removeMember(teamId, userId);
    }

    @DeleteMapping("/{id}")
    public void deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
    }
}