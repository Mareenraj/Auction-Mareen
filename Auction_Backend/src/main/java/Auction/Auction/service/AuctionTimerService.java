package Auction.Auction.service;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.concurrent.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuctionTimerService {
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    private final ConcurrentHashMap<Long, AuctionInfo> timers = new ConcurrentHashMap<>();
    private final ApplicationEventPublisher eventPublisher;
    @Value("${auction.timer.timeout}")
    private long timeoutSeconds;

    public boolean startOrResetTimerForPlayerAllocation(Long playerId, Long teamId) {
        if (playerId == null || teamId == null) {
            log.error("Invalid input: playerId or teamId is null");
            throw new IllegalArgumentException("playerId and teamId must not be null");
        }

        log.debug("Checking for existing timer for playerId: {}", playerId);
        AuctionInfo oldInfo = timers.get(playerId);
        if (oldInfo != null && !oldInfo.future().isDone()) {
            log.info("Canceling existing timer for playerId: {}", playerId);
            oldInfo.future().cancel(true);
        }

        log.info("Starting new timer for playerId: {} and teamId: {}", playerId, teamId);
        try {
            ScheduledFuture<?> newTimer = scheduler.schedule(() -> {
                timers.remove(playerId);
                log.info("Timer expired for playerId: {}, notifying system", playerId);
                eventPublisher.publishEvent(new PlayerAllocationTimeoutEvent(playerId, teamId));
            }, timeoutSeconds, TimeUnit.SECONDS);
            timers.put(playerId, new AuctionInfo(newTimer, teamId));
            log.debug("Timer scheduled for playerId: {}", playerId);
            return true;
        } catch (RejectedExecutionException e) {
            log.error("Failed to schedule timer for playerId: {}", playerId, e);
            return false;
        }
    }

    public boolean isTimerActive(Long playerId) {
        AuctionInfo info = timers.get(playerId);
        return info != null && !info.future().isDone();
    }

    public long getRemainingTime(Long playerId) {
        AuctionInfo info = timers.get(playerId);
        return info != null && !info.future().isDone() ? info.future().getDelay(TimeUnit.SECONDS) : -1;
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down AuctionTimerService scheduler");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                log.warn("Scheduler did not terminate within 5 seconds, forcing shutdown");
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            log.error("Interrupted during scheduler shutdown", e);
            scheduler.shutdownNow();
        }
    }

    private record AuctionInfo(
            ScheduledFuture<?> future,
            Long teamId
    ) {
    }

    public record PlayerAllocationTimeoutEvent(
            Long playerId,
            Long teamId) {
    }
}