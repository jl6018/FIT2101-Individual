# MA_Wednesday10am_Team5

FIT2101 S2 2026 group repository — Sprint 3 Final Release.

## Team
- Emily Thang Wen Xin — Scrum Master / QA Testing Lead
- Lim Jia Li — Frontend Developer / Backend Developer / QA Testing Lead
- Nur Atifah Thaiyub Ahamed — Backend Developer / Git Manager
- Violet Arianna Ariff Hoo — Frontend Developer / QA Testing Lead
- Aastha Chaudhari — Frontend Developer
- Lee Hyeonjin — Backend Developer

*(Note: Individual contributions are tracked via Git commit history and work logs).*

## About Symph
Symph is an all-in-one Agile project management tool.
It allows Admins to plan sprints, assign tasks, and track progress using a drag-and-drop Kanban board.
Employees can log their hours directly against tasks, and the system automatically generates team contribution reports and sprint burndown charts.

## 🛠Technology Stack
- Backend: Java 17, Spring Boot 3.5, Spring Data JPA, Hibernate
- Frontend: HTML5, CSS3, Vanilla JavaScript (compiled from TypeScript)
- Database: MySQL (Hosted on Railway for production, H2 for testing)
- Testing: JUnit 5, Mockito (132 automated tests, 62% code coverage)
- Deployment: Docker, Render, Railway

## Repository Structure
- `src/main/java/webapplication/Application.java` — Spring Boot entry point
- `src/main/java/webapplication/controller/` — REST API endpoints
- `src/main/java/webapplication/service/` — Business logic
- `src/main/java/webapplication/repository/` — JPA repositories
- `src/main/java/webapplication/model/` — Entity classes
- `src/main/java/webapplication/dto/` — Data Transfer Objects
- `src/main/resources/application.properties` — Database and JPA configuration
- `src/main/webapp/` — Frontend files (HTML, CSS, JavaScript)
- `src/test/java/` — JUnit 5 unit and integration tests
- `Dockerfile` — Docker configuration for deployment
- `settings.xml` — Maven mirror configuration

## How to Run Locally

1. Clone this repository.
2. Ensure you have **Java 17** and **Maven** installed.
3. Ensure a local **MySQL** database is running (create a database named `symph`).
4. Update the environment variables or `application.properties` to match your local MySQL credentials:
   ```properties
   SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/symph
   SPRING_DATASOURCE_USERNAME=root
   SPRING_DATASOURCE_PASSWORD=YOUR_PASSWORD
5. Run the Spring Boot application: http://localhost:8080/index-login-page.html

## Live Application

https://symph-individual.onrender.com/index-login-page.html