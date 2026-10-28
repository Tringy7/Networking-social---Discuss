package com.discuss.discuss.config.init;

import com.discuss.discuss.entity.Category;
import com.discuss.discuss.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class CategoryDataInitializer implements CommandLineRunner {

    private record Seed(String name, String slug) {}

    private static final List<Seed> CATEGORIES = List.of(
            new Seed("Technology", "technology"),
            new Seed("Programming", "programming"),
            new Seed("Gaming", "gaming"),
            new Seed("Anime & Manga", "anime-manga"),
            new Seed("Movies & TV", "movies-tv"),
            new Seed("Music", "music"),
            new Seed("Sports", "sports"),
            new Seed("Science", "science"),
            new Seed("Education & Learning", "education-learning"),
            new Seed("Business & Finance", "business-finance"),
            new Seed("Careers & Work", "careers-work"),
            new Seed("Art & Design", "art-design"),
            new Seed("Photography & Video", "photography-video"),
            new Seed("Food & Drink", "food-drink"),
            new Seed("Travel", "travel"),
            new Seed("Health & Fitness", "health-fitness"),
            new Seed("Fashion & Beauty", "fashion-beauty"),
            new Seed("Humor & Memes", "humor-memes"),
            new Seed("News & Politics", "news-politics"),
            new Seed("Books & Writing", "books-writing"),
            new Seed("Pets & Animals", "pets-animals"),
            new Seed("Cars & Motorcycles", "cars-motorcycles"),
            new Seed("Home & Garden", "home-garden"),
            new Seed("DIY & Crafts", "diy-crafts"),
            new Seed("Collectibles & Hobbies", "collectibles-hobbies"),
            new Seed("Relationships & Family", "relationships-family"),
            new Seed("Languages & Culture", "languages-culture"),
            new Seed("Vietnam & Local", "vietnam-local"),
            new Seed("Questions & Stories", "questions-stories"),
            new Seed("Other", "other")
    );

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        Set<String> existing = categoryRepository.findAllSlugs();

        List<Category> toInsert = CATEGORIES.stream()
                .filter(s -> !existing.contains(s.slug()))
                .map(s -> Category.builder()
                        .name(s.name())
                        .slug(s.slug())
                        .build())
                .toList();

        if (!toInsert.isEmpty()) {
            categoryRepository.saveAll(toInsert);
            log.info("Seeded {} categories", toInsert.size());
        }
    }
}
