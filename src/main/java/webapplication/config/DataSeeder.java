package webapplication.config;

import webapplication.service.TeamService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Creates the default teams when the application starts
 *
 * @author Lim Jia Li
 * @author Atifah
 * @version 17.0.16
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final TeamService teamService;

    /**
     * Constructor with the required TeamService dependency
     *
     * @param teamService The service that creates the teams
     */
    public DataSeeder(TeamService teamService) {
        this.teamService = teamService;
    }

    /**
     * Executes the default team seeding routine when the application starts.
     *
     * @param args Command-line arguments passed to the Spring Boot application; not used
     */
    @Override
    public void run(String... args) {
        teamService.seedDefaults();
    }
}