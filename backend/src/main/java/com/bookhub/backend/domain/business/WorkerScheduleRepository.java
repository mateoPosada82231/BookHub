package com.bookhub.backend.domain.business;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerScheduleRepository extends JpaRepository<WorkerSchedule, Long> {

    List<WorkerSchedule> findByWorkerId(Long workerId);

    List<WorkerSchedule> findByWorkerIdAndAvailableTrue(Long workerId);

    @Modifying
    @Query("DELETE FROM WorkerSchedule ws WHERE ws.worker.id = :workerId")
    void deleteByWorkerId(@Param("workerId") Long workerId);
}
