package com.discuss.discuss.service.admin;
import com.discuss.discuss.dto.community.CategoryRequestDTO;
import com.discuss.discuss.dto.community.CategoryResponseDTO;
import com.discuss.discuss.entity.Category;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.community.CategoryService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@RequiredArgsConstructor
@HasRole("ADMIN")
public class AdminCategoryService {
    private final CategoryService categoryService;
    private final ActivityLogService activityLogService;
    public List<CategoryResponseDTO> list() { return categoryService.findAll(); }

    @Transactional
    public CategoryResponseDTO create(CategoryRequestDTO request) {
        CategoryResponseDTO result = categoryService.create(request);
        activityLogService.record("CREATE_CATEGORY", "CATEGORY", result.id(), null);
        return result;
    }

    @Transactional
    public CategoryResponseDTO update(Long id, CategoryRequestDTO request) {
        var result = categoryService.update(id, request);
        activityLogService.record("UPDATE_CATEGORY", "CATEGORY", id, null);
        return result;
    }

    @Transactional
    public void delete(Long id) {
        categoryService.delete(id);
        activityLogService.record("DELETE_CATEGORY", "CATEGORY", id, null);
    }
}
