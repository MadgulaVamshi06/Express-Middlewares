const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies

// Validation Middleware
function validateTodoData(req, res, next) {
    const { ID, Name, Rating, Description, Genre, Cast } = req.body;
    const errors = [];

    if (typeof ID !== 'number') errors.push('ID must be a number');
    if (typeof Name !== 'string') errors.push('Name must be a string');
    if (typeof Rating !== 'number') errors.push('Rating must be a number');
    if (typeof Description !== 'string') errors.push('Description must be a string');
    if (typeof Genre !== 'string') errors.push('Genre must be a string');
    if (!Array.isArray(Cast) || !Cast.every(c => typeof c === 'string')) errors.push('Cast must be an array of strings');

    if (errors.length > 0) {
        res.status(400).json({ message: 'bad request. some data is incorrect.', errors });
    } else {
        next();
    }
}

// Read the database file
const readDatabase = () => {
    try {
        const data = fs.readFileSync('db.json');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database file:', err);
        return { todos: [] }; // Return an empty database structure if file read fails
    }
};

// Write to the database file
const writeDatabase = (data) => {
    try {
        fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing to database file:', err);
    }
};

// Ensure database file exists and is properly initialized
if (!fs.existsSync('db.json')) {
    writeDatabase({ todos: [] });
}

// GET route
app.get('/', (req, res) => {
    const db = readDatabase();
    res.json(db.todos);
});

// POST route
app.post('/', validateTodoData, (req, res) => {
    const db = readDatabase();

    // Check for unique ID
    if (db.todos.some(todo => todo.ID === req.body.ID)) {
        return res.status(400).json({ message: 'ID must be unique' });
    }

    db.todos.push(req.body);
    writeDatabase(db);
    res.status(200).send('data received');
});

// Error handling middleware for unexpected errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
