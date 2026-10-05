package webapplication.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Handles browser page navigation for the Symph web application.
 * Redirects the root URL to the login page.
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */

@Controller
public class PageController {

    /**
     * Redirects the application root URL to the login page.
     *
     * @return A redirect string pointing to the login page
     */
    @GetMapping("/")
    public String root() {
        return "redirect:/index-login-page.html";
    }
}