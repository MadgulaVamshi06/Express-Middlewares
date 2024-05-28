const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 4000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Create a write stream for logging
const logDirectory = path.join(__dirname, "src");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, "access.log"),
  { flags: "a" }
);

// Custom Morgan format
morgan.token("content-length", (req, res) => res.get("Content-Length") || "-");
morgan.token("response-time", (req, res) => res.responseTime || "-");
const loggerFormat =
  ":method :status :res[content-length] - :response-time ms :date[iso] HTTP/:http-version :url";

app.use(
  morgan(loggerFormat, {
    stream: accessLogStream,
    immediate: true,
  })
);

// Read the database file
const readDatabase = () => {
  try {
    const data = fs.readFileSync("db.json");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file:", err);
    return { todos: [] }; // Return an empty database structure if file read fails
  }
};

// Write to the database file
const writeDatabase = (data) => {
  try {
    fs.writeFileSync("db.json", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
};

// Ensure database file exists and is properly initialized
if (!fs.existsSync("db.json")) {
  writeDatabase({ todos: [] });
}

// Routes
app.get("/", (req, res) => {
  const db = readDatabase();
  res.json(db.todos);
  res.status(200).send("Welcome to the Home Page!");
});

app.get("/get-users", (req, res) => {
  const db = readDatabase();
  res.json(db.todos);
  res.status(200).json({ message: "Users retrieved successfully" });
});

app.post("/add-user", (req, res) => {
  const db = readDatabase();

  // Check for unique ID
  if (db.todos.some((todo) => todo.ID === req.body.ID)) {
    return res.status(400).json({ message: "ID must be unique" });
  }

  db.todos.push(req.body);
  writeDatabase(db);
  res.status(201).json({ message: "User added successfully" });
});

app.put("/user/:id", (req, res) => {
  const db = readDatabase();
  const userIndex = db.todos.findIndex((todo) => todo.ID === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.todos[userIndex] = { ...db.todos[userIndex], ...req.body };
  writeDatabase(db);
  res.status(200).json({ message: `User with ID ${req.params.id} updated successfully` });
});

app.delete("/user/:id", (req, res) => {
  const db = readDatabase();
  const userIndex = db.todos.findIndex((todo) => todo.ID === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.todos.splice(userIndex, 1);
  writeDatabase(db);
  res.status(200).json({ message: `User with ID ${req.params.id} deleted successfully` });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
