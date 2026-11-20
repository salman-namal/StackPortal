package com.stackportal.entity.master;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "media_files") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MediaFile {
    @Id private UUID id;
    @Column(name = "file_name", nullable = false, length = 255) private String fileName;
    @Column(name = "content_type", nullable = false, length = 100) private String contentType;
    @Column(name = "file_size", nullable = false) private long fileSize;
    @Column(name = "file_data", nullable = false, columnDefinition = "bytea") private byte[] fileData;
    @Column(name = "thumbnail_data", columnDefinition = "bytea") private byte[] thumbnailData;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @PrePersist void create() { var now = LocalDateTime.now(); createdAt = now; updatedAt = now; if (id == null) id = UUID.randomUUID(); }
    @PreUpdate void update() { updatedAt = LocalDateTime.now(); }
}
