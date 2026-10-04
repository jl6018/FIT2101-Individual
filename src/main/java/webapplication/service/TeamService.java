package webapplication.service;

import webapplication.model.Team;
import webapplication.model.User;
import webapplication.repository.TeamRepository;
import webapplication.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public TeamService(
            TeamRepository teamRepository,
            UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public Team getTeamById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));
    }

    public Team createTeam(Team team) {
        return teamRepository.save(team);
    }

    public Team updateTeam(Long id, Team teamDetails) {
        Team team = getTeamById(id);
        team.setName(teamDetails.getName());
        return teamRepository.save(team);
    }

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

    public Team addMemberByName(String teamName, Long userId, String jobTitle) {
        Team team = teamRepository.findByName(teamName)
                .orElseGet(() -> {
                    Team t = new Team();
                    t.setName(teamName);
                    return teamRepository.save(t);
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ Save job title to the user
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

    // ✅ UPDATED: Remove member also clears user.team
    public Team removeMember(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        team.getMembers().remove(user);
        user.setTeam(null);
        userRepository.save(user);

        return teamRepository.save(team);
    }

    public void deleteTeam(Long id) {
        teamRepository.deleteById(id);
    }
}