let tasks = JSON.parse(localStorage.getItem('focusmate_tasks')) || [];

function saveTasks() {
    localStorage.setItem('focusmate_tasks', JSON.stringify(tasks));
}

let currentPlannerView = 'kanban';

function setPlannerView(view) {
    currentPlannerView = view;
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${view}'`));
    });
    renderBoard();
}

function renderBoard() {
    const boardContainer = document.querySelector('.kanban-board');
    if (!boardContainer) return;

    if (currentPlannerView === 'kanban' || currentPlannerView === 'daily') {
        renderKanbanLayout();
    } else if (currentPlannerView === 'weekly') {
        renderWeeklyView();
    }

    initDragAndDrop();
    updateTaskCounts();
}

function renderKanbanLayout() {
    const boardContainer = document.querySelector('.kanban-board');
    boardContainer.classList.remove('weekly-grid');
    boardContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';

    boardContainer.innerHTML = `
        <div class="kanban-column" id="col-todo" data-status="todo">
            <div class="column-header">
                <h3>To Do</h3>
                <span class="task-count" id="count-todo">0</span>
            </div>
            <div class="task-list" id="tasks-todo"></div>
        </div>
        <div class="kanban-column" id="col-inprogress" data-status="inprogress">
            <div class="column-header">
                <h3>In Progress</h3>
                <span class="task-count" id="count-inprogress">0</span>
            </div>
            <div class="task-list" id="tasks-inprogress"></div>
        </div>
        <div class="kanban-column" id="col-done" data-status="done">
            <div class="column-header">
                <h3>Done</h3>
                <span class="task-count" id="count-done">0</span>
            </div>
            <div class="task-list" id="tasks-done"></div>
        </div>
    `;

    const tasksTodo = document.getElementById('tasks-todo');
    const tasksInProgress = document.getElementById('tasks-inprogress');
    const tasksDone = document.getElementById('tasks-done');

    tasks.forEach(task => {
        const taskEl = createTaskElement(task);
        if (task.status === 'todo') tasksTodo.appendChild(taskEl);
        else if (task.status === 'inprogress') tasksInProgress.appendChild(taskEl);
        else if (task.status === 'done') tasksDone.appendChild(taskEl);
    });
}

function renderWeeklyView() {
    const boardContainer = document.querySelector('.kanban-board');
    boardContainer.innerHTML = '';
    boardContainer.classList.add('weekly-grid');
    boardContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((day, index) => {
        const col = document.createElement('div');
        col.className = 'kanban-column weekly-column';
        col.dataset.status = 'todo';
        col.dataset.dayIndex = index;
        col.innerHTML = `
            <div class="column-header">
                <h3>${day}</h3>
            </div>
            <div class="task-list" id="week-day-${index}"></div>
        `;
        boardContainer.appendChild(col);

        const dayTasks = tasks.filter((t, i) => i % 7 === index);
        dayTasks.forEach(task => {
            col.querySelector('.task-list').appendChild(createTaskElement(task));
        });
    });
}

async function generateAIPlan() {
    const goal = prompt("What is your main goal for this period? (e.g. Learn Python in a week)");
    if (!goal) return;

    createNotification("FocusMate AI", "Creating your personalized plan...", "🧠");

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Create a ${currentPlannerView} plan for the goal: "${goal}". Return a simple JSON array of task objects like this: [{"title": "Task Name", "estimate": "30m"}]. Return ONLY the JSON.`,
                mode: 'analytical'
            })
        });

        const data = await response.json();
        const match = data.response.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("No plan found in AI response");
        const newTasks = JSON.parse(match[0]);

        newTasks.forEach(t => {
            tasks.push({
                id: Date.now().toString() + Math.random(),
                title: t.title,
                status: 'todo',
                estimate: t.estimate || '30m'
            });
        });

        saveTasks();
        renderBoard();
        createNotification("Plan Generated", `Added ${newTasks.length} tasks to your board.`, "✅");
    } catch (e) {
        console.error(e);
        alert("Failed to generate plan. Please ensure the AI returned valid JSON.");
    }
}

function createTaskElement(task) {
    const div = document.createElement('div');
    const priority = task.priority || 'medium';
    div.className = `task-card priority-${priority}`;
    div.draggable = true;
    div.dataset.id = task.id;

    const priorityLabels = {
        'urgent': '🔴 Urgent',
        'high': '🟠 High',
        'medium': '🟡 Medium',
        'low': '🟢 Low'
    };

    div.innerHTML = `
        <div class="task-priority-tag">${priorityLabels[priority]}</div>
        <div class="task-title" title="${task.title}">${task.title}</div>
        <div class="task-meta">
            <span class="task-estimate" data-tooltip="AI-estimated time">⏳ ${task.estimate}</span>
            <button class="ai-breakdown-btn" onclick="breakdownTask('${task.id}')" data-tooltip="Split into micro-steps">✨ Break Down</button>
        </div>
    `;

    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);

    return div;
}

function updateTaskCounts() {
    document.getElementById('count-todo').textContent = tasks.filter(t => t.status === 'todo').length;
    document.getElementById('count-inprogress').textContent = tasks.filter(t => t.status === 'inprogress').length;
    document.getElementById('count-done').textContent = tasks.filter(t => t.status === 'done').length;
}

// Drag and Drop Logic
let draggedTask = null;

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedTask = null;
}

function initDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    const lists = document.querySelectorAll('.task-list');

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('drag-over');

            if (!draggedTask) return;

            const status = column.dataset.status;
            if (!status) return;

            const taskId = draggedTask.dataset.id;
            const task = tasks.find(t => t.id === taskId);

            if (task) {
                const oldStatus = task.status;
                task.status = status;

                if (status === 'done' && oldStatus !== 'done') {
                    task.completedAt = new Date().toISOString();
                } else if (status !== 'done') {
                    delete task.completedAt;
                }

                saveTasks();
                renderBoard();
                createNotification("Task Updated", `Moved back to ${status}`, "📌");
            }
        });
    });
}

// Task Management
function openTaskModal() {
    document.getElementById('task-modal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
}

async function addNewTask() {
    const title = document.getElementById('new-task-title').value;
    const priority = document.getElementById('new-task-priority').value;
    if (!title) return;

    const newTask = {
        id: Date.now().toString(),
        title: title,
        status: 'todo',
        priority: priority,
        estimate: 'Estimating...'
    };

    tasks.push(newTask);
    renderBoard();
    closeTaskModal();
    document.getElementById('new-task-title').value = '';

    // Auto-estimate with AI
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Estimate time for task: "${title}". Return ONLY the duration (e.g. "45m", "2h", "15m"). Be realistic.`,
                mode: 'analytical'
            })
        });
        const data = await response.json();
        newTask.estimate = data.response.trim();
        saveTasks();
        renderBoard();
    } catch (e) {
        newTask.estimate = '30m';
        saveTasks();
        renderBoard();
    }
}

// AI Integration: Break down a task into micro-steps directly on the board
async function breakdownTask(taskId) {
    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;

    createNotification("FocusMate AI", `Splitting "${parentTask.title}" into micro-steps...`, "✨");

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Task: "${parentTask.title}". Break this down into 3-5 very small, actionable micro-tasks (max 15-30 mins each). Return a simple JSON array of strings: ["step 1", "step 2", ...]. Return ONLY the JSON.`,
                mode: 'analytical'
            })
        });

        const data = await response.json();
        const match = data.response.match(/\[.*\]/s);
        if (!match) throw new Error("Could not parse AI response");

        const steps = JSON.parse(match[0]);

        steps.forEach((stepTitle, index) => {
            tasks.push({
                id: Date.now().toString() + Math.random(),
                title: `[${index + 1}] ${stepTitle}`,
                status: 'todo',
                estimate: '15-20m'
            });
        });

        saveTasks();
        renderBoard();
        createNotification("Success", `Created ${steps.length} micro-steps for you.`, "✅");

    } catch (e) {
        console.error("Breakdown error:", e);
        createNotification("AI Error", "Could not break down task. Make sure the server is running.", "❌");
    }
}

// AI Adaptive Planning & Habit Memory
async function adaptPlanWithAI() {
    const tasks = JSON.parse(localStorage.getItem('focusmate_tasks')) || [];
    const completed = tasks.filter(t => t.status === 'done');
    const todo = tasks.filter(t => t.status === 'todo');

    if (todo.length === 0) {
        createNotification("Adaptive AI", "To Do list is empty, nothing to adapt.", "😴");
        return;
    }

    createNotification("Adaptive AI", "Analyzing your progress to adjust the plan...", "🧠");

    const habits = JSON.parse(localStorage.getItem('focusmate_habits')) || { lastEfficiency: 0, failPatterns: [] };
    const stats = {
        completionRate: tasks.length > 0 ? (completed.length / tasks.length) : 0,
        todoCount: todo.length,
        habits: habits
    };

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Based on a ${Math.round(stats.completionRate * 100)}% completion rate and memory of habits (${JSON.stringify(habits)}), how should I adjust the current ${stats.todoCount} tasks? 
                Option 1: Simplify them. Option 2: Reschedule. Option 3: Break down more.
                Return a JSON: {"logic": "Explanation", "actions": [{"taskTitle": "...", "newTitle": "...", "newEstimate": "..."}]}. 
                Adjust only 2-3 most critical tasks. Return ONLY JSON.`,
                mode: 'analytical'
            })
        });

        const data = await response.json();
        const match = data.response.match(/\{.*\}/s);
        const result = JSON.parse(match[0]);

        result.actions.forEach(action => {
            const task = tasks.find(t => t.title.includes(action.taskTitle) || action.taskTitle.includes(t.title));
            if (task) {
                if (action.newTitle) task.title = action.newTitle;
                if (action.newEstimate) task.estimate = action.newEstimate;
            }
        });

        saveTasks();
        renderBoard();

        habits.lastEfficiency = stats.completionRate;
        localStorage.setItem('focusmate_habits', JSON.stringify(habits));

        alert(`AI Plan adapted: ${result.logic}`);
        createNotification("Success", "Plan successfully adjusted to your pace.", "✅");

    } catch (e) {
        console.error("Adaptation error:", e);
        createNotification("AI Error", "Failed to adapt plan automatically.", "❌");
    }
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tasks-todo')) {
        renderBoard();
        initDragAndDrop();
    }
});
