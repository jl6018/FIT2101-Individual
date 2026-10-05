package webapplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Symph web application.
 * Initializes Spring Boot, Tomcat, MySQL, and the REST API to handle client requests.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@SpringBootApplication
public class Application {

    /**
     * The main method that starts the Spring Boot web server.
     *
     * @param args The command-line arguments passed to the application
     */
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}