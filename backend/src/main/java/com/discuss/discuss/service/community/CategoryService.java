package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.community.CategoryRequestDTO;
import com.discuss.discuss.dto.community.CategoryResponseDTO;
import com.discuss.discuss.entity.Category;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.repository.CategoryRepository;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CommunityInfoRepository communityInfoRepository;

    public List<CategoryResponseDTO> findAll() {
        return categoryRepository
                .findAll(Sort.by("name"))
                .stream()
                .map(c -> new CategoryResponseDTO(c.getId(), c.getName(), c.getSlug()))
                .toList();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new CommunityException(CommunityErrorCode.CATEGORY_NOT_FOUND));
    }
    @HasRole("ADMIN")
    @Transactional
    public CategoryResponseDTO create(CategoryRequestDTO request) {
        return this.saveCategory(new Category(), request);
    }

    @HasRole("ADMIN")
    @Transactional
    public CategoryResponseDTO update(Long id, CategoryRequestDTO request) {
        return this.saveCategory(this.getCategoryById(id), request);
    }

    private CategoryResponseDTO saveCategory(Category category, CategoryRequestDTO request) {
        String name = request.name().strip();
        String slug = request.slug().strip();
        Long excludedId = category.getId() == null ? -1L : category.getId();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, excludedId)
                || categoryRepository.existsBySlugIgnoreCaseAndIdNot(slug, excludedId)) {
            throw new CommunityException(CommunityErrorCode.CATEGORY_ALREADY_EXISTS);
        }
        category.setName(name);
        category.setSlug(slug);
        try {
            categoryRepository.saveAndFlush(category);
        } catch (DataIntegrityViolationException ex) {
            throw new CommunityException(CommunityErrorCode.CATEGORY_ALREADY_EXISTS);
        }
        return new CategoryResponseDTO(category.getId(), category.getName(), category.getSlug());
    }

    @HasRole("ADMIN")
    @Transactional
    public void delete(Long id) {
        Category category = getCategoryById(id);
        if (communityInfoRepository.existsByCategoryId(id)) throw new CommunityException(CommunityErrorCode.CATEGORY_IN_USE);
        try {
            categoryRepository.delete(category);
            categoryRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new CommunityException(CommunityErrorCode.CATEGORY_IN_USE);
        }
    }
}
