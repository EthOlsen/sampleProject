
$(document).ready(function() {
    getTasks(); 
});


let lastSortedColumn = 'completed'; 
let lastSortedOrder = 'desc'; 

//pulls up edit modal gets data from backend
function editTask(button) {
    let taskId = $(button).data("id");

    axios.get(`http://localhost:3010/api/tasks/${taskId}`)
        .then(response => {
            let task = response.data;
            //console.log("Editing Task:", task);

            $("#editTaskId").val(task.id);
            $("#editTitle").val(task.title);
            $("#editDescription").val(task.description);
            $("#editDueDate").val(task.due_date);
            $("#editCompleted").prop("checked", task.completed);

      
            $('#modalTitle').text('Edit Task');
            $('#saveButton').text('Save Changes');

            $("#editModal").show();
        })
        .catch(error => {
            console.error("Error fetching task details:", error);
        });

}

//hides the edit modal, clears values first 
function hideModal() {

    $('#editTaskId').val('');
    $('#editTitle').val('');
    $('#editDescription').val('');
    $('#editDueDate').val('');
    $('#editCompleted').prop('checked', false);
    $("#editModal").hide().attr("aria-hidden", "true");

}

//  save tasks from edit modal, updated backend
function saveTask() {

    let taskId = $("#editTaskId").val();
    let updatedTask = {
        title: $("#editTitle").val(),
        description: $("#editDescription").val(),
        due_date: $("#editDueDate").val(),
        completed: $("#editCompleted").prop("checked") ? 1 : 0
    };

    if (!updatedTask.title || !updatedTask.due_date) {
        alert("Title and Due Date are required!");
        return;  // Stop if title is empty
    }

    if (taskId) {
        // Update task API call
        axios.patch(`http://localhost:3010/api/tasks/edit/${taskId}`, {
            title: updatedTask.title,
            description: updatedTask.description,
            due_date: updatedTask.due_date,
            completed: updatedTask.completed
        })
        .then(response => {
            console.log("Task updated:", response.data);
            updateTaskInTable(taskId, updatedTask.title, updatedTask.description, updatedTask.due_date, updatedTask.completed); // Update front-end table
            hideModal();
            getTasks();
        })
        .catch(error => {
            console.error("Error updating task:", error);
        });
    } else {
        // Add new task API call
        axios.post('http://localhost:3010/api/tasks', {
            title: updatedTask.title,
            description: updatedTask.description,
            due_date: updatedTask.due_date,
            completed: updatedTask.completed
        })
        .then(response => {
            console.log("Task added:", response.data);
            addTaskToTable(response.data); // Add the new task to the front end table
            hideModal();
            getTasks();
        })
        .catch(error => {
            console.error("Error adding task:", error);
        });
    }
    
}

// deletes task on backend
function deleteTask(button){
    let taskId = $(button).data('id');

    if(confirm("Are you sure you want to delete this task?")){

        axios.delete(`http://localhost:3010/api/tasks/${taskId}`)
        .then(response =>{
            console.log("task deleted:", response.data);
            $(button).closest('tr').remove();
            getTasks();
        })
        .catch(error => {
            console.error("Error deleting task:", error);
        });
    }else{
        console.log("Task deletion canceled")
    }

}

// if a task is marked as complete from the table, updates table and backend
function updateTaskCompletion(id, checked){

    let completed = checked ? 1 : 0;
    let url = 'http://localhost:3010/api/tasks/';

    axios.patch(
        url + id , {
            completed
    })
    .then(response => {
        console.log("Task updated:", response.data);
        getTasks();
    })
    .catch(error => {
        console.error("Error updating task:", error);
    });
}

// add button clicked to show add modal
function showAddModal() {
    // Clear inputs
    $('#editTaskId').val('');
    $('#editTitle').val('');
    $('#editDescription').val('');
    $('#editDueDate').val('');
    $('#editCompleted').prop('checked', false);

    // change title and button to add
   
    $('#modalTitle').text('Add New Task');
    $('#saveButton').text('Add Task');

    $("#editModal").show().removeAttr("aria-hidden");
}

// called from loop to add individual tasks to table
function addTaskToTable(task) {
    let completedClass = task.completed === 1 ? "completed-task" : "";

    $('#taskList').append(
        `<tr data-id="${task.id}" class="${completedClass}">
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${task.due_date}</td>
            <td><input type="checkbox" ${task.completed === 1 ? 'checked' : ''} onchange="updateTaskCompletion(${task.id}, this.checked)"></td>
            <td><button type="button" onclick="editTask(this)" data-id="${task.id}" class="editButton"><i class="fas fa-pencil-alt"></i></button></td>
            <td><button type="button" onclick="deleteTask(this)" data-id="${task.id}" class="deleteButton"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`
    );
}

function updateTaskInTable(taskId, title, description, dueDate, completed) {
    let row = $(`tr[data-id="${taskId}"]`);
    row.find('td').eq(0).text(title);
    row.find('td').eq(1).text(description);
    row.find('td').eq(2).text(dueDate);
    row.find('td').eq(3).find('input[type="checkbox"]').prop('checked', completed === 1);
}



async function getTasks(sortBy = 'completed', order = 'desc') {
    let url = `http://localhost:3010/api/tasks?sortBy=${sortBy}&order=${order}`;

    axios.get(url).then(function (response) {
        //console.log(response);

        // define arrow direction 
        let arrow = order === 'asc' ? '<i class="fas fa-arrow-up"></i>' : '<i class="fas fa-arrow-down"></i>';

        // update table header with sorting arrows
        let tableHead = `<tr>
                            <th onclick="sortColumn('title')">Title ${sortBy === 'title' ? arrow : ''}</th>
                            <th onclick="sortColumn('description')">Description ${sortBy === 'description' ? arrow : ''}</th>
                            <th onclick="sortColumn('due_date')">Due Date ${sortBy === 'due_date' ? arrow : ''}</th>
                            <th onclick="sortColumn('completed')">Completed </th>
                            <th>Edit</th>
                            <th>Delete</th>
                        </tr>`;

        $('#taskList').html(tableHead);

        for (let i = 0; i < response.data.length; i++) {
            addTaskToTable(response.data[i]);  
        }
    });

    // Store last sorted column and order 
    lastSortedColumn = sortBy;
    lastSortedOrder = order;
}


function sortColumn(column) {
    let order = (column === lastSortedColumn && lastSortedOrder === 'asc') ? 'desc' : 'asc';
    
    getTasks(column, order);
}