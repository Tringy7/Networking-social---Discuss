# Comment votes

Comments and replies use the same UP/DOWN voting behavior as posts.

- `PUT /comments/{id}/vote` with JSON `{ "type": "UP" }` or `{ "type": "DOWN" }` sets the authenticated user's vote. Repeating the same request is idempotent.
- `DELETE /comments/{id}/vote` removes the authenticated user's vote and is idempotent.
- Both endpoints return `CommentResponseDTO`, including `voteScore` (upvotes minus downvotes) and `userVote` (`UP`, `DOWN`, or `null`). Comment list/create/update responses include these fields too.
- Only visible comments on published posts in active communities can be voted on. Private-community read access is required, using the same policy as post voting.
- `comment_votes` stores one row per `(comment_id, user_id)`, enforced by a unique constraint. A pessimistic lock on the comment serializes vote changes.
- The current development configuration uses `spring.jpa.hibernate.ddl-auto=update`; restarting the backend creates the new table. Environments with schema updates disabled need an equivalent schema migration before enabling these endpoints.

Validation: `./mvnw test` runs comment-vote service tests. Frontend uses the shared `VoteControl` component and clears a vote when its selected direction is clicked again.
