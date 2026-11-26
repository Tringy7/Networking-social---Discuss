package com.discuss.discuss.controller.comment;

import com.discuss.discuss.entity.Comment;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CommentRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostCommentControllerIntegrationTest extends AbstractApiIntegrationTest {
    @Autowired private CommentRepository comments;

    @Test
    void listsOnlyCommentsFromTheRequestedPostAndHonorsCommunityPrivacy() throws Exception {
        User owner = user(UserRole.USER);
        User visitor = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PRIVATE);
        Post post = publishedPost(owner, community);
        comments.save(Comment.builder().user(owner).post(post).content("Visible comment")
                .status(CommentStatus.VISIBLE).build());
        comments.save(Comment.builder().user(owner).post(publishedPost(owner, community))
                .content("Other post").status(CommentStatus.VISIBLE).build());

        mvc.perform(get("/posts/{id}/comments", post.getId()).with(as(visitor)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/posts/{id}/comments", post.getId()).with(as(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].content").value("Visible comment"));
    }
}
