require("dotenv").config();
const cors = require("cors");
const express = require("express");
const ObjectID = require("bson-objectid");
const { Database } = require("bun:sqlite");

// our app
const app = express();

// cors for freeCodeCamp (by freeCodeCamp)
app.use(cors({ optionsSuccessStatus: 200 }));

// server static files
app.use(express.static(process.cwd() + "/public"));

// parse json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// initialize database
const db = new Database(":memory:");
db.exec(await Bun.file("index.sql").text());

// Exercise Tracker Microservice
const usersPostQuery = db.query(`\
insert into users(_id, username)
values(?1, ?2)
returning *;`);

app.post("/api/users", async ({ body: { username } }, res) => {
  const _id = ObjectID().toHexString();
  res.json(usersPostQuery.get(_id, username));
});

const usersGetQuery = db.query(`select * from users;`);
app.get("/api/users", async (_, res) => {
  res.json(usersGetQuery.all());
});

const exercisesPostQuery = db.query(`\
insert into exercises(description, duration, date, userid)
values(?1, ?2, ?3, ?4)
returning description, duration, date;`);

const exercisesUserQuery = db.query(`\
select * from users where (_id = ?);
`);

app.post(
  "/api/users/:_id/exercises",
  async ({ params: { _id }, body: { description, duration, date } }, res) => {
    date = (date ? new Date(date) : new Date()).toDateString();

    const user = exercisesUserQuery.get(_id);
    const exercise = exercisesPostQuery.get(description, duration, date, _id);

    res.json({ ...user, ...exercise });
  },
);

const exercisesGetQuery = db.query(`\
select description, duration, date
from exercises where (userid = ?);
`);

app.get(
  "/api/users/:_id/logs",
  async ({ params: { _id }, query: { from, to, limit } }, res) => {
    const user = exercisesUserQuery.get(_id);
    let log = exercisesGetQuery.all(_id);

    from = new Date(from || 0).valueOf();
    to = !to ? null : new Date(to).valueOf();

    log = log.filter(({ date }) => {
      date = new Date(date).valueOf();
      return date >= from && (to === null || date <= to);
    });

    if (limit) log = log.slice(0, +limit);
    res.json({ ...user, count: log.length, log });
  },
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
