create table "game_started" (id bigserial primary key, ts timestamp with time zone not null);

create table "game_ended" (id bigint references "game_started" (id) primary key, ts timestamp with time zone not null);

create table "player_created" (id bigserial primary key, ts timestamp with time zone not null);

create table "player_name_changed" (id bigserial primary key, ts timestamp with time zone not null, userid bigint references "player_created" (id) not null, username varchar(32) not null);

create table "player_password_hash_changed" (id bigserial primary key, ts timestamp with time zone not null, userid bigint references "player_created" (id) not null, hash bytea not null);

-- In order to add an e-mail address, a user must first have a username and a password set.
create table "player_email_address_added" (id bigserial primary key, ts timestamp with time zone not null, userid bigint references "player_created" (id) not null, current_username bigint references "player_name_changed" (id) not null, email_address varchar(255) not null, verification_code char(36));

create table "player_email_address_verified" (id bigserial primary key, ts timestamp with time zone not null, email_address bigint references "player_email_address_added" (id));

create table "player_email_address_removed" (id bigserial primary key, ts timestamp with time zone not null, email_address bigint references "player_email_address_added" (id));

create table "player_joined_game" (id bigserial primary key, ts timestamp with time zone not null, userid bigint references "player_created" (id) not null, current_username bigint references "player_name_changed" (id) null, game bigint references "game_started" (id) not null);
