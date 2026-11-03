# Post voting

Score is upvotes minus downvotes, with no lower bound. Each signed-in user has at most one vote per post. New posts start at zero; the author is not automatically upvoted.

- `PUT /posts/{id}/vote` with `{"type":"UP"}` or `{"type":"DOWN"}` sets the vote idempotently.
- `DELETE /posts/{id}/vote` removes the current user's vote idempotently.
- Both return the updated post. Responses now use `voteScore` and `userVote` (`UP`, `DOWN`, or null), replacing `heartCount` and `isHearted`.
- Clicking the selected direction in the UI removes it. Switching DOWN to UP changes the score by +2.
- Popular feeds sort by net score. Private community access is checked before voting.

Existing databases: inspect and resolve duplicate `(post_id, user_id)` rows before adding the unique constraint. Retain the intended vote per user; do not blindly discard conflicting votes. Existing UP rows count as +1 and DOWN rows as -1.

```sql
SELECT post_id, user_id, COUNT(*) FROM post_votes
GROUP BY post_id, user_id HAVING COUNT(*) > 1;
-- After resolving duplicates; only add if no equivalent constraint already exists:
ALTER TABLE post_votes ADD CONSTRAINT uk_post_vote_user UNIQUE (post_id, user_id);
```

Deploy the backend and frontend together because the post response field names change. Comment reactions are unchanged.
