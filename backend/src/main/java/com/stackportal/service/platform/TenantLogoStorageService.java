package com.stackportal.service.platform;
import com.stackportal.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException; import java.nio.file.*; import java.util.*;
@Service public class TenantLogoStorageService {
 private static final long MAX_SIZE=2L*1024*1024; private static final Map<String,String> EXT=Map.of("image/jpeg",".jpg","image/png",".png","image/webp",".webp");
 private final Path root=Path.of("uploads","tenant-logos").toAbsolutePath().normalize();
 public String store(MultipartFile file){ if(file==null||file.isEmpty())throw new ApiException("A logo file is required",HttpStatus.BAD_REQUEST); if(file.getSize()>MAX_SIZE)throw new ApiException("Logo must be 2 MB or smaller",HttpStatus.BAD_REQUEST); String ext=EXT.get(file.getContentType()); if(ext==null)throw new ApiException("Logo must be a JPG, PNG, or WebP image",HttpStatus.BAD_REQUEST); try{Files.createDirectories(root);Path target=root.resolve(UUID.randomUUID()+ext).normalize();if(!target.startsWith(root))throw new ApiException("Invalid logo path",HttpStatus.BAD_REQUEST);Files.copy(file.getInputStream(),target,StandardCopyOption.REPLACE_EXISTING);return "/uploads/tenant-logos/"+target.getFileName();}catch(IOException ex){throw new ApiException("Unable to store tenant logo",HttpStatus.INTERNAL_SERVER_ERROR);} }
}
