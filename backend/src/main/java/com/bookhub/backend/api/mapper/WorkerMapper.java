package com.bookhub.backend.api.mapper;

import com.bookhub.backend.api.dto.business.WorkerResponse;
import com.bookhub.backend.domain.business.Worker;
import org.springframework.stereotype.Component;

/**
 * Centralized mapper for Worker -> WorkerResponse.
 * Eliminates duplicate mapping in BusinessService and WorkerService.
 */
@Component
public class WorkerMapper {

    public WorkerResponse toResponse(Worker worker) {
        return WorkerResponse.builder()
                .id(worker.getId())
                .userId(worker.getUser().getId())
                .fullName(worker.getUser().getProfile() != null
                        ? worker.getUser().getProfile().getFullName()
                        : null)
                .avatarUrl(worker.getUser().getProfile() != null
                        ? worker.getUser().getProfile().getAvatarUrl()
                        : null)
                .position(worker.getPosition())
                .active(worker.isActive())
                .businessId(worker.getBusiness().getId())
                .businessName(worker.getBusiness().getName())
                .createdAt(worker.getCreatedAt())
                .build();
    }
}
