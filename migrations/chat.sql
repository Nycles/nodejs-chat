-- Up migration
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  content VARCHAR NOT NULL,
  room_id INT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (room_id) REFERENCES rooms (id),
  FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE users_rooms (
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  PRIMARY KEY (user_id, room_id)
);

-- Down migration
DROP TABLE rooms;

DROP TABLE messages;

DROP TABLE users_rooms;