let productivityChart = null;
let distributionChart = null;

function refreshStats() {
    console.log("Refreshing stats...");
    const tasks = JSON.parse(localStorage.getItem('focusmate_tasks')) || [];
    const completedTasks = tasks.filter(t => t.status === 'done');

    // 1. Basic Metrics
    const streakEl = document.getElementById('stat-streak');
    const percentEl = document.getElementById('stat-percent');
    const efficiencyEl = document.getElementById('stat-efficiency');

    // Streaks
    const streak = calculateStreak(completedTasks);
    if (streakEl) streakEl.textContent = `${streak} Days`;

    // Completion Rate
    const rate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    if (percentEl) percentEl.textContent = `${rate}%`;

    // Focus Level (Based on velocity)
    const focusLevel = completedTasks.length > 0 ? Math.min(100, (completedTasks.length * 7) + 20) : 0;
    if (efficiencyEl) {
        efficiencyEl.textContent = `${focusLevel}%`;
        efficiencyEl.style.color = focusLevel > 70 ? '#22c55e' : (focusLevel > 40 ? '#eab308' : '#ef4444');
    }

    // Productivity Score calculation
    const score = Math.min(100, (rate * 0.6) + (streak * 10));
    const scoreEl = document.getElementById('stat-efficiency');
    if (scoreEl) {
        scoreEl.innerHTML = `<span>${score}</span><small>/100</small>`;
    }

    // 2. Charts
    renderCharts(tasks, completedTasks);

    // 3. Calendar & History
    renderHeatmap(completedTasks);
    updateImprovementLog(rate, streak);
}

function renderCharts(allTasks, completedTasks) {
    renderMainChart(completedTasks);
    renderDistributionChart(allTasks);
}

function renderMainChart(completedTasks) {
    const ctx = document.getElementById('productivityChart').getContext('2d');
    if (productivityChart) productivityChart.destroy();

    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString([], { weekday: 'short' }));
        const count = completedTasks.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === d.toDateString()).length;
        data.push(count);
    }

    productivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks',
                data: data,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderDistributionChart(allTasks) {
    const canvas = document.getElementById('distributionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (distributionChart) distributionChart.destroy();

    const todo = allTasks.filter(t => t.status === 'todo').length;
    const progress = allTasks.filter(t => t.status === 'inprogress').length;
    const done = allTasks.filter(t => t.status === 'done').length;

    distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['To Do', 'In Progress', 'Done'],
            datasets: [{
                data: [todo, progress, done],
                backgroundColor: ['#e2e8f0', '#93c5fd', '#2563EB'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: 'Inter', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    bodyFont: { family: 'Inter' }
                }
            },
            layout: {
                padding: 10
            }
        }
    });
}

function renderHeatmap(completedTasks) {
    const grid = document.getElementById('progress-calendar');
    if (!grid) return;
    grid.innerHTML = '';

    // Show last 28 days
    for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const count = completedTasks.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === d.toDateString()).length;

        const day = document.createElement('div');
        day.className = 'cal-day';
        if (count > 0) day.classList.add(`level-${Math.min(4, count)}`);
        day.title = `${d.toDateString()}: ${count} tasks`;
        grid.appendChild(day);
    }
}

async function runDeepDiagnostic() {
    const tasks = JSON.parse(localStorage.getItem('focusmate_tasks')) || [];
    const completed = tasks.filter(t => t.status === 'done');
    const todo = tasks.filter(t => t.status === 'todo');
    const inProgress = tasks.filter(t => t.status === 'inprogress').length;

    // UI Loading state
    const ids = ['insight-procrastination', 'insight-optimization', 'insight-risks'];
    ids.forEach(id => {
        const el = document.getElementById(id).querySelector('p');
        el.textContent = "AI is auditing your patterns...";
        el.classList.add('loading');
    });

    const context = `
        Behavioral Audit Data:
        - Total tasks: ${tasks.length}
        - Completed: ${completed.length}
        - In Progress: ${inProgress}
        - Stuck in To Do: ${todo.length}
        - Efficiency: ${document.getElementById('stat-efficiency').textContent}
    `;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `${context}
                Identify 3 things, returning them as a JSON object with keys: "scenario" (typical procrastination), "optimization" (habit recommendations), and "risks" (forecasting risky periods).
                Return ONLY the JSON.`,
                mode: 'analytical'
            })
        });

        const data = await response.json();
        const match = data.response.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Invalid AI response format");

        const result = JSON.parse(match[0]);

        const formatInsight = (val) => typeof val === 'object' ? JSON.stringify(val) : val;

        document.getElementById('insight-procrastination').querySelector('p').textContent = formatInsight(result.scenario || result.scenarios);
        document.getElementById('insight-optimization').querySelector('p').textContent = formatInsight(result.optimization || result.recommendations);
        document.getElementById('insight-risks').querySelector('p').textContent = formatInsight(result.risks || result.forecasting);

        createNotification("Audit Complete", "Behavioral diagnostic finalized.", "🧠");
    } catch (e) {
        console.error(e);
        ids.forEach(id => {
            document.getElementById(id).querySelector('p').textContent = "Failed to run audit. Check connection.";
        });
    }
}

async function analyzeProcrastination() {
    const tasks = JSON.parse(localStorage.getItem('focusmate_tasks')) || [];
    const analysisBox = document.getElementById('ai-pattern-analysis');

    analysisBox.innerHTML = '<p>AI is identifying success patterns... 🧬</p>';

    const done = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Analyze productivity for ${done}/${total} tasks. Identify success patterns or risk of failure. Keep it to 2 insightful sentences.`,
                mode: 'analytical'
            })
        });
        const data = await response.json();
        analysisBox.innerHTML = `<p>${data.response}</p>`;
    } catch (e) {
        analysisBox.innerHTML = '<p>Failed to get analysis.</p>';
    }
}

function updateImprovementLog(rate, streak) {
    const list = document.getElementById('improvement-history');
    if (!list) return;

    const improvements = [];
    if (rate > 50) improvements.push("Stable productivity baseline established.");
    if (streak > 2) improvements.push("Consistency pattern detected: 3+ day streak.");

    if (improvements.length === 0) return;

    list.innerHTML = improvements.map(text => `
        <div class="improvement-item">
            <div class="icon">📈</div>
            <div class="text">${text}</div>
        </div>
    `).join('');
}

function calculateStreak(completedTasks) {
    if (completedTasks.length === 0) return 0;
    const dates = [...new Set(completedTasks.map(t => new Date(t.completedAt).toDateString()))]
        .map(d => new Date(d)).sort((a, b) => b - a);

    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    if ((today - dates[0]) / 86400000 > 1) return 0;

    for (let i = 0; i < dates.length; i++) {
        let diff = (today - dates[i]) / 86400000;
        if (diff === streak || diff === streak + 1) streak++;
        else break;
    }
    return streak;
}
