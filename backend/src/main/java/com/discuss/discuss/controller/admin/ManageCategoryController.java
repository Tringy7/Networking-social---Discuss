package com.discuss.discuss.controller.admin;
import com.discuss.discuss.dto.community.CategoryRequestDTO;
import com.discuss.discuss.dto.community.CategoryResponseDTO;
import com.discuss.discuss.service.admin.AdminCategoryService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/admin/categories")
@RequiredArgsConstructor @Validated @HasRole("ADMIN")
public class ManageCategoryController {
    private final AdminCategoryService service;
    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> list() { return ResponseEntity.ok(service.list()); }
    @PostMapping
    public ResponseEntity<CategoryResponseDTO> create(@Valid @RequestBody CategoryRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }
    @PatchMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> update(@PathVariable @Positive Long id, @Valid @RequestBody CategoryRequestDTO request) {
        return ResponseEntity.ok(service.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id); return ResponseEntity.noContent().build();
    }
}
