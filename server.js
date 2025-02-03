const express = require('express');
const sqlite3 = require('sqlite3').verbose();


const app = express();
const PORT = 3010;


app.use(express.json());
app.use(express.static('static'));


app.get(`/script.js`, (req, res) => {
    res.sendFile(`${__dirname}/static/script.js`);
  });
  

app.get('', (req, res) => {
    res.sendFile(`${__dirname}/static/index.html`);
});

//connect to Database
const db = new sqlite3.Database('./tasks.db', (err) =>{
    if (err){
        console.log(err)
    }
    console.log('connected to SQLite DB.')
})



//create table
db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL,
    completed INTEGER DEFAULT 0
)`);

// retrieve task list and sorting,
app.get('/api/tasks', async (req, res) => {

    let sortBy = req.query.sortBy || 'title'; 
    let sortOrder = req.query.order === 'desc' ? 'DESC' : 'ASC';

    let sql = `SELECT * FROM tasks ORDER BY completed ASC, ${sortBy} COLLATE NOCASE ${sortOrder};`; //not case specific sorting, completed tasks at bottom

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// patch tasks for the completed checkmarks
app.patch('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id
    const completed =  req.body.completed;

    console.log(`Received PATCH request for task ${taskId} - Completed:`, completed); // Debugging

    let sql = `UPDATE tasks SET completed = ? WHERE id = ?`;

    db.run(sql, [completed, taskId], function(err){
        if(err){
            console.error('Error updating task:', err);
            return res.status(500).json({error: 'update task failed'})
        }
        res.status(200).json({ message: 'Task updated successfully' });
    })
});



//add new task
app.post('/api/tasks', async (req, res) => {

    let newTask = {
        id: 0, 
        title: req.body.title,
        description: req.body.description,
        due_date: req.body.due_date,
        completed: req.body.completed
    }

    const sql = `INSERT INTO tasks (title, description, due_date, completed) VALUES (?,?,?,?)`;
    const params = [newTask.title, newTask.description, newTask.due_date, newTask.completed]

    db.run(sql, params, function (err) {

            if (err) {
                return res.status(500).json({ error: err.message });
            }
            console.log('New task inserted with ID:', this.lastID);

            res.json({ id: this.lastID, 
                title: newTask.title, 
                description: newTask.description, 
                due_date: newTask.due_date, 
                completed: 0 });
        }
    )
});


// fetches single task for the edit modal
app.get('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    let sql = 'SELECT * FROM tasks WHERE id = ?';
    
    db.get(sql, [taskId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve task' });
        }
        res.json(row);
    });
});

//updates the task from the edit modal
app.patch('/api/tasks/edit/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, due_date, completed } = req.body;

    
    let sql = `UPDATE tasks SET title = ?, description = ?, due_date = ?, completed = ? WHERE id = ?`;
    
    db.run(sql, [title, description, due_date, completed, taskId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Update failed' });
        }
        res.status(200).json({ message: 'Task updated successfully' });
    });
});

// delete tasks
app.delete('/api/tasks/:id', (req,res)=>{

    const taskId = req.params.id;

    const sql = `DELETE FROM tasks WHERE id = ?`;
    
    db.run(sql, [taskId], function(err){
        if(err){
            console.error('Error deleting task:', err);
            return res.status(500).json({error:'Failed to delete task'});
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    })
})

app.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})


