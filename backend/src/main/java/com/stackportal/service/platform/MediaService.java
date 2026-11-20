package com.stackportal.service.platform;

import com.stackportal.dto.response.media.MediaResponse;
import com.stackportal.entity.master.MediaFile;
import com.stackportal.repository.master.MediaFileRepository;
import com.stackportal.repository.master.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service @RequiredArgsConstructor @Transactional(transactionManager = "masterTransactionManager")
public class MediaService {
    private static final long MAX_SIZE = 2L * 1024 * 1024;
    private static final Map<String, String> TYPES = Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");
    private final MediaFileRepository repository;
    private final TenantRepository tenantRepository;

    public MediaResponse uploadImage(MultipartFile upload) {
        if (upload == null || upload.isEmpty() || upload.getSize() > MAX_SIZE) throw new MediaException("Image must be 2 MB or smaller");
        String type = upload.getContentType();
        if (!TYPES.containsKey(type)) throw new MediaException("Only JPG, PNG, and WebP images are supported");
        try {
            byte[] data = upload.getBytes();
            if (!hasSignature(data, type)) throw new MediaException("The uploaded file is not a valid " + type + " image");
            MediaFile saved = repository.save(MediaFile.builder().fileName(safeName(upload.getOriginalFilename(), TYPES.get(type))).contentType(type).fileSize(data.length).fileData(data).thumbnailData(data).build());
            return new MediaResponse(saved.getId(), saved.getFileName(), saved.getContentType(), saved.getFileSize());
        } catch (IOException e) { throw new MediaException("Unable to read uploaded image"); }
    }
    @Transactional(readOnly = true, transactionManager = "masterTransactionManager") public MediaFile get(UUID id) { return repository.findById(id).orElseThrow(() -> new MediaException("Media file not found", HttpStatus.NOT_FOUND)); }
    public boolean exists(UUID id) { return id != null && repository.existsById(id); }
    public void deleteIfUnreferenced(UUID id) { if (id != null && !tenantRepository.existsByLogoId(id)) repository.deleteById(id); }
    private boolean hasSignature(byte[] b, String t) { return switch (t) { case "image/jpeg" -> b.length >= 3 && b[0] == (byte)255 && b[1] == (byte)216 && b[2] == (byte)255; case "image/png" -> b.length >= 8 && b[0] == (byte)137 && b[1] == 80 && b[2] == 78 && b[3] == 71; case "image/webp" -> b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P'; default -> false; }; }
    private String safeName(String value, String ext) { String n = value == null ? "image" : value.replaceAll("[^A-Za-z0-9._-]", "_"); return n.isBlank() ? "image." + ext : n; }
    public static class MediaException extends RuntimeException { final HttpStatus status; MediaException(String m) { this(m, HttpStatus.BAD_REQUEST); } MediaException(String m, HttpStatus s) { super(m); status = s; } }
}
