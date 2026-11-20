package com.stackportal.dto.response.media;
import java.util.UUID;
public record MediaResponse(UUID id, String fileName, String contentType, long fileSize) { }
