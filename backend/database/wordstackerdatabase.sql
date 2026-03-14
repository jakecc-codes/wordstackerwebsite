CREATE TABLE `blockstacks` (
  `id` bigserial PRIMARY KEY,
  `pos_id` integer AUTO_INCREMENT DEFAULT (0),
  `tag` varchar(255) NOT NULL,
  `text` varchar(255) NOT NULL,
  `creation_date` timestamp DEFAULT (now())
);

CREATE INDEX `blockstacks_index_0` ON `blockstacks` (`pos_id`);

CREATE INDEX `blockstacks_index_1` ON `blockstacks` (`creation_date`);

CREATE INDEX `blockstacks_index_2` ON `blockstacks` (`tag`);
