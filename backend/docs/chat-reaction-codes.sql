-- Convert legacy chat reactions in an existing MySQL database. Safe to rerun.
UPDATE chat_reactions
SET emoji = CASE HEX(emoji)
    WHEN 'F09F918D' THEN 'LIKE'
    WHEN 'E29DA4EFB88F' THEN 'LOVE'
    WHEN 'F09F9882' THEN 'LAUGH'
    WHEN 'F09F98AE' THEN 'WOW'
    WHEN 'F09F98A2' THEN 'SAD'
    WHEN 'F09F8E89' THEN 'CELEBRATE'
    ELSE emoji
END
WHERE HEX(emoji) IN ('F09F918D', 'E29DA4EFB88F', 'F09F9882', 'F09F98AE', 'F09F98A2', 'F09F8E89');
