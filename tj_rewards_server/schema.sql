CREATE DATABASE taco_joes_rewards;
USE taco_joes_rewards;

CREATE TABLE users (
    id integer PRIMARY KEY AUTO_INCREMENT,
    first VARCHAR(255) NOT NULL,
    last VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    points INTEGER DEFAULT 0,
    rewards VARCHAR(255) DEFAULT ""
);

CREATE TABLE rewards (
    id VARCHAR(255) DEFAULT ""
);

INSERT INTO users (username, password)
VALUES
('jamesmcaleer', 'wordpass123'),
('samzerbo', 'sunnydog1026');
