package com.discuss.discuss.controller.community;

import com.discuss.discuss.repository.CategoryRepository;
import com.discuss.discuss.service.community.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    public record CategoryResponseDTO(Long id, String name, String slug) {}
    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getAll() {
        return ResponseEntity.ok(this.categoryService.findAll());
    }
}