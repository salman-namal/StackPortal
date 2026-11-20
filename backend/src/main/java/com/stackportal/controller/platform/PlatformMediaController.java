package com.stackportal.controller.platform;
import com.stackportal.common.response.ApiResponse;
import com.stackportal.dto.response.media.MediaResponse;
import com.stackportal.entity.master.MediaFile;
import com.stackportal.service.platform.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@RestController @RequestMapping("/api/platform/media") @RequiredArgsConstructor @PreAuthorize("hasRole('SUPER_ADMIN')")
public class PlatformMediaController {
 private final MediaService media;
 @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE) public ResponseEntity<ApiResponse<MediaResponse>> upload(@RequestParam("file") MultipartFile file) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Image uploaded", media.uploadImage(file))); }
 @GetMapping("/{id}") public ResponseEntity<byte[]> original(@PathVariable UUID id) { return binary(media.get(id), false); }
 @GetMapping("/{id}/thumbnail") public ResponseEntity<byte[]> thumbnail(@PathVariable UUID id) { return binary(media.get(id), true); }
 private ResponseEntity<byte[]> binary(MediaFile file, boolean thumb) { byte[] data = thumb && file.getThumbnailData() != null ? file.getThumbnailData() : file.getFileData(); return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.getContentType())).cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePrivate()).body(data); }
}
