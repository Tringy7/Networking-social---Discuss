package com.discuss.discuss.service.community;

import com.discuss.discuss.controller.community.CategoryController;
import com.discuss.discuss.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public List<CategoryController.CategoryResponseDTO> findAll() {
        return categoryRepository
                .findAll(Sort.by("name"))
                .stream()
                .map(c -> new CategoryController.CategoryResponseDTO(c.getId(), c.getName(), c.getSlug()))
                .toList();
    }
}
