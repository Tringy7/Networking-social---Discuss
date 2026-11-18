package com.discuss.discuss.service.community;
import com.discuss.discuss.dto.community.CategoryRequestDTO;
import com.discuss.discuss.entity.Category;
import com.discuss.discuss.exception.community.*;
import com.discuss.discuss.repository.*;
import org.junit.jupiter.api.*;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class CategoryServiceTest {
    CategoryRepository categories;
    CommunityInfoRepository communities;
    CategoryService service;
    @BeforeEach void setup() {
        categories = mock(CategoryRepository.class); communities = mock(CommunityInfoRepository.class);
        service = new CategoryService(categories, communities);
    }
    @Test void cannotDeleteCategoryInUse() {
        when(categories.findById(1L)).thenReturn(Optional.of(Category.builder().id(1L).build()));
        when(communities.existsByCategoryId(1L)).thenReturn(true);
        var error = assertThrows(CommunityException.class, () -> service.delete(1L));
        assertEquals(CommunityErrorCode.CATEGORY_IN_USE, error.getError());
        verify(categories, never()).delete(any());
    }
    @Test void duplicateSlugCannotBeCreated() {
        when(categories.existsBySlugIgnoreCaseAndIdNot("java", -1L)).thenReturn(true);
        var error = assertThrows(CommunityException.class, () -> service.create(new CategoryRequestDTO("Java", "java")));
        assertEquals(CommunityErrorCode.CATEGORY_ALREADY_EXISTS, error.getError());
        verify(categories, never()).saveAndFlush(any());
    }
    @Test void unusedCategoryCanBeDeleted() {
        var category = Category.builder().id(1L).build();
        when(categories.findById(1L)).thenReturn(Optional.of(category));
        service.delete(1L);
        verify(categories).delete(category);
        verify(categories).flush();
    }
}
