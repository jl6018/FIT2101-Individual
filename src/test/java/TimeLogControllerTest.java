import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import webapplication.Application;
import webapplication.controller.TimeLogController;
import webapplication.dto.TaskHours;
import webapplication.dto.TimeLogSummary;
import webapplication.model.TimeLog;
import webapplication.service.TimeLogService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for TimeLogController.
 * Tests logging hours (US24), per-user/task retrieval, sprint totals (US25),
 * summary (US26/27), member range (US28), and hours-per-task (US29).
 *
 * @author Lim Jia Li
 * @version 17.0.16
 */
@WebMvcTest(controllers = TimeLogController.class)
@ContextConfiguration(classes = Application.class)
class TimeLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TimeLogService timeLogService;

    /**
     * US24: logging hours via the DTO endpoint returns 200 with the saved log.
     */
    @Test
    void testLogHours_Dto() throws Exception {
        TimeLog saved = new TimeLog();
        saved.setId(1L);
        saved.setDate(LocalDate.now());
        saved.setStartTime(LocalTime.of(9, 30));
        saved.setHours(2.5);
        saved.setDescription("Worked on API");

        when(timeLogService.logHours(
                anyString(), anyString(), anyDouble(), anyString(), anyLong(), anyLong()))
                .thenReturn(saved);

        String body = "{"
                + "\"date\":\"" + LocalDate.now() + "\","
                + "\"startTime\":\"09:30\","
                + "\"hours\":2.5,"
                + "\"description\":\"Worked on API\","
                + "\"taskId\":1,"
                + "\"userId\":1"
                + "}";

        mockMvc.perform(post("/api/timelogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.hours").value(2.5));
    }

    /**
     * US24: invalid input returns 400 Bad Request.
     */
    @Test
    void testLogHours_Dto_Invalid_Returns400() throws Exception {
        when(timeLogService.logHours(
                anyString(), anyString(), anyDouble(), any(), anyLong(), anyLong()))
                .thenThrow(new IllegalArgumentException("Hours must be greater than 0"));

        String body = "{"
                + "\"date\":\"" + LocalDate.now() + "\","
                + "\"startTime\":\"09:30\","
                + "\"hours\":0,"
                + "\"taskId\":1,"
                + "\"userId\":1"
                + "}";

        mockMvc.perform(post("/api/timelogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    /**
     * Tests that retrieving logs by user returns the correct count.
     */
    @Test
    void testGetLogsByUser() throws Exception {
        TimeLog log1 = new TimeLog(); log1.setId(1L); log1.setHours(4.0);
        TimeLog log2 = new TimeLog(); log2.setId(2L); log2.setHours(6.0);

        when(timeLogService.getLogsByUser(anyLong())).thenReturn(Arrays.asList(log1, log2));

        mockMvc.perform(get("/api/timelogs/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    /**
     * Tests that retrieving logs by task returns the correct count.
     */
    @Test
    void testGetLogsByTask() throws Exception {
        TimeLog log = new TimeLog(); log.setId(1L); log.setHours(8.0);

        when(timeLogService.getLogsByTask(anyLong())).thenReturn(Collections.singletonList(log));

        mockMvc.perform(get("/api/timelogs/task/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * US25: GET /sprint/{id}/total returns a plain number.
     */
    @Test
    void testGetTotalHoursForSprint() throws Exception {
        when(timeLogService.getTotalHoursForSprint(anyLong())).thenReturn(12.5);

        mockMvc.perform(get("/api/timelogs/sprint/1/total"))
                .andExpect(status().isOk())
                .andExpect(content().string("12.5"));
    }

    /**
     * US26 / US27: GET /summary returns one row per employee.
     */
    @Test
    void testGetSummary() throws Exception {
        TimeLogSummary row = new TimeLogSummary(
                1L, "Employee One", "Team Alpha", 10.0, 3, 3.33);

        when(timeLogService.getSummaryByRange(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(row));

        mockMvc.perform(get("/api/timelogs/summary")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Employee One"))
                .andExpect(jsonPath("$[0].totalHours").value(10.0));
    }

    /**
     * US28: GET /user/{id}/range returns that user's logs.
     */
    @Test
    void testGetLogsForUserInRange() throws Exception {
        TimeLog log = new TimeLog();
        log.setId(1L);
        log.setDate(LocalDate.now());
        log.setHours(4.0);

        when(timeLogService.getLogsForUserInRange(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(log));

        mockMvc.perform(get("/api/timelogs/user/1/range")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * US29: GET /by-task returns hours per task.
     */
    @Test
    void testGetHoursPerTask() throws Exception {
        TaskHours row = new TaskHours(1L, "Login page", 5.5);

        when(timeLogService.getHoursPerTask(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(row));

        mockMvc.perform(get("/api/timelogs/by-task")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].taskName").value("Login page"))
                .andExpect(jsonPath("$[0].totalHours").value(5.5));
    }
}