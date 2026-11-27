-- Apply once to a Discuss database that predates chat, with Hibernate schema updates disabled.
ALTER TABLE user_privacy_settings ADD COLUMN allow_chat_requests BOOLEAN NULL;
ALTER TABLE outbox_events
  ADD COLUMN chat_recipient_id BIGINT NULL,
  MODIFY COLUMN report_target_type ENUM('COMMENT','COMMUNITY','MESSAGE','POST') NULL;
ALTER TABLE notifications
  MODIFY COLUMN report_target_type ENUM('COMMENT','COMMUNITY','MESSAGE','POST') NULL;

CREATE TABLE chat_conversations (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  direct_key VARCHAR(50) UNIQUE,
  kind ENUM('DIRECT','GROUP') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_members (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_through BIGINT,
  pinned BOOLEAN NOT NULL,
  hidden BOOLEAN NOT NULL,
  muted BOOLEAN NOT NULL,
  UNIQUE KEY uq_chat_member (conversation_id,user_id),
  KEY ix_chat_member_user (user_id),
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_requests (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL UNIQUE,
  sender_id BIGINT NOT NULL,
  recipient_id BIGINT NOT NULL,
  status ENUM('ACCEPTED','PENDING','REJECTED','WITHDRAWN') NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  body VARCHAR(4000) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  reply_to_id BIGINT,
  edited_at DATETIME(6),
  recalled_at DATETIME(6),
  UNIQUE KEY uq_chat_client_message (conversation_id,sender_id,client_id),
  KEY ix_chat_history (conversation_id,id),
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_hidden_messages (
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  PRIMARY KEY (message_id,user_id),
  FOREIGN KEY (message_id) REFERENCES chat_messages(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_attachments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT NOT NULL,
  object_key VARCHAR(100) NOT NULL UNIQUE,
  filename VARCHAR(180) NOT NULL,
  content_type VARCHAR(80) NOT NULL,
  KEY ix_chat_attachment_message (message_id),
  FOREIGN KEY (message_id) REFERENCES chat_messages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_reactions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  emoji VARCHAR(16) NOT NULL,
  UNIQUE KEY uq_chat_reaction (message_id,user_id),
  FOREIGN KEY (message_id) REFERENCES chat_messages(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_blocks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  blocker_id BIGINT NOT NULL,
  blocked_id BIGINT NOT NULL,
  UNIQUE KEY uq_chat_block (blocker_id,blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id),
  FOREIGN KEY (blocked_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_message_reports (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT NOT NULL,
  sender_username VARCHAR(30) NOT NULL,
  reported_text VARCHAR(4000) NOT NULL,
  attachment_count INT NOT NULL,
  reporter_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  description VARCHAR(2000),
  status ENUM('PENDING','REJECTED','RESOLVED') NOT NULL,
  handled_by BIGINT,
  handled_at DATETIME(6),
  resolution_note VARCHAR(2000),
  action VARCHAR(40),
  created_at DATETIME(6),
  KEY ix_chat_report_duplicate (message_id,reporter_id,status),
  FOREIGN KEY (message_id) REFERENCES chat_messages(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (handled_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
