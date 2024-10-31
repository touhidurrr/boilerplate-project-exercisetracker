create table users (
    _id text primary key,
    username text unique
);

create table exercises (
    description text not null,
    duration integer not null,
    date text not null,
    userid integer references users(_id) on delete cascade
);