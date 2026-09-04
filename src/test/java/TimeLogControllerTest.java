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
import webapplication.model.TimeLog;
import webapplication.service.TimeLogService;

import java.time.LocalDate;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = TimeLogController.class)
@ContextConfiguration(classes = Application.class)
class TimeLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TimeLogService timeLogService;

    @Test
    void testLogHours() throws Exception {
        TimeLog log = new TimeLog();
        log.setId(1L);
        log.setDate(LocalDate.now());
        log.setHours(8.5);
        log.setDescription("Worked on API");

        when(timeLogService.logHours(any(TimeLog.class))).thenReturn(log);

        mockMvc.perform(post("/api/timelogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(log)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.hours").value(8.5));
    }

    @Test
    void testGetLogsByUser() throws Exception {
        TimeLog log1 = new TimeLog(); log1.setId(1L); log1.setHours(4.0);
        TimeLog log2 = new TimeLog(); log2.setId(2L); log2.setHours(6.0);

        when(timeLogService.getLogsByUser(anyLong())).thenReturn(Arrays.asList(log1, log2));

        mockMvc.perform(get("/api/timelogs/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void testGetLogsByTask() throws Exception {
        TimeLog log = new TimeLog(); log.setId(1L); log.setHours(8.0);

        when(timeLogService.getLogsByTask(anyLong())).thenReturn(Arrays.asList(log));

        mockMvc.perform(get("/api/timelogs/task/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}