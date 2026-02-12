// Todo List Module
let todos = [];

async function loadTodos() {
    try {
        const response = await authFetch('/api/todos');
        const data = await response.json();
        
        if (data.todos) {
            todos = data.todos;
            renderTodos();
        }
    } catch (err) {
        console.error('Error loading todos:', err);
    }
}

function renderTodos() {
    const container = document.getElementById('todo-list');
    if (!container) return;
    
    if (todos.length === 0) {
        container.innerHTML = `
            <p style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">
                <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 15px;"></i><br>
                Belum ada tugas
            </p>
        `;
        return;
    }
    
    container.innerHTML = todos.map(todo => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})" style="width: 20px; height: 20px;">
            <span style="flex: 1; text-decoration: ${todo.completed ? 'line-through' : 'none'}; color: ${todo.completed ? 'rgba(255,255,255,0.5)' : 'white'};">${todo.title}</span>
            <button onclick="deleteTodo(${todo.id})" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function addTodo() {
    const input = document.getElementById('todo-input');
    const title = input.value.trim();
    
    if (!title) {
        showToast('Masukkan tugas terlebih dahulu!', 'error');
        return;
    }
    
    try {
        const response = await authFetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Tugas ditambahkan!', 'success');
            input.value = '';
            loadTodos();
        }
    } catch (err) {
        showToast('Gagal menambahkan tugas', 'error');
    }
}

async function toggleTodo(id) {
    try {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        
        const response = await authFetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !todo.completed })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTodos();
        }
    } catch (err) {
        showToast('Gagal mengupdate tugas', 'error');
    }
}

async function deleteTodo(id) {
    if (!confirm('Hapus tugas ini?')) return;
    
    try {
        const response = await authFetch(`/api/todos/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Tugas dihapus!', 'success');
            loadTodos();
        }
    } catch (err) {
        showToast('Gagal menghapus tugas', 'error');
    }
}

// Notes Module
let notes = [];

async function loadNotes() {
    try {
        const response = await authFetch('/api/notes');
        const data = await response.json();
        
        if (data.notes) {
            notes = data.notes;
            renderNotes();
        }
    } catch (err) {
        console.error('Error loading notes:', err);
    }
}

function renderNotes() {
    const container = document.getElementById('notes-list');
    if (!container) return;
    
    if (notes.length === 0) {
        container.innerHTML = `
            <p style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="fas fa-notes-medical" style="font-size: 3rem; margin-bottom: 15px;"></i><br>
                Belum ada catatan
            </p>
        `;
        return;
    }
    
    container.innerHTML = notes.map(note => `
        <div style="padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <h4 style="color: white; margin-bottom: 10px;">${note.title}</h4>
            <p style="color: rgba(255,255,255,0.7); margin-bottom: 10px;">${note.content}</p>
            <small style="color: rgba(255,255,255,0.5);">${new Date(note.created_at).toLocaleDateString()}</small>
            <button onclick="deleteNote(${note.id})" style="float: right; background: none; border: none; color: #ef4444; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function addNote() {
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title) {
        showToast('Masukkan judul catatan!', 'error');
        return;
    }
    
    try {
        const response = await authFetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Catatan ditambahkan!', 'success');
            titleInput.value = '';
            contentInput.value = '';
            loadNotes();
        }
    } catch (err) {
        showToast('Gagal menambahkan catatan', 'error');
    }
}

async function deleteNote(id) {
    if (!confirm('Hapus catatan ini?')) return;
    
    try {
        const response = await authFetch(`/api/notes/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Catatan dihapus!', 'success');
            loadNotes();
        }
    } catch (err) {
        showToast('Gagal menghapus catatan', 'error');
    }
}

// Calendar Module
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let events = [];

function showCalendarSection() {
    showSection('calendar');
    renderCalendar();
    loadEvents();
}

function renderCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month');
    
    if (!container || !monthLabel) return;
    
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = '';
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    dayNames.forEach(day => {
        html += `<div style="padding: 10px; font-weight: bold; color: rgba(255,255,255,0.7);">${day}</div>`;
    });
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === dateStr);
        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        
        html += `
            <div style="padding: 10px; border-radius: 8px; ${isToday ? 'background: var(--primary-color);' : 'background: rgba(255,255,255,0.1);'} cursor: pointer;" onclick="showEventsForDate('${dateStr}')">
                <span style="color: white;">${day}</span>
                ${hasEvent ? '<i class="fas fa-circle" style="font-size: 8px; color: #10b981; margin-left: 5px;"></i>' : ''}
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

async function loadEvents() {
    try {
        const response = await authFetch('/api/events');
        const data = await response.json();
        
        if (data.events) {
            events = data.events;
            renderCalendar();
        }
    } catch (err) {
        console.error('Error loading events:', err);
    }
}

async function addEvent() {
    const dateInput = document.getElementById('event-date');
    const titleInput = document.getElementById('event-title');
    
    const date = dateInput.value;
    const title = titleInput.value.trim();
    
    if (!date || !title) {
        showToast('Masukkan tanggal dan judul event!', 'error');
        return;
    }
    
    try {
        const response = await authFetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, title })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Event ditambahkan!', 'success');
            titleInput.value = '';
            loadEvents();
        }
    } catch (err) {
        showToast('Gagal menambahkan event', 'error');
    }
}

function showEventsForDate(dateStr) {
    const dayEvents = events.filter(e => e.date === dateStr);
    const container = document.getElementById('events-list');
    
    if (!container) return;
    
    if (dayEvents.length === 0) {
        container.innerHTML = `<p style="color: rgba(255,255,255,0.5);">Tidak ada event pada tanggal ini</p>`;
        return;
    }
    
    container.innerHTML = dayEvents.map(e => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;">
            <span style="color: white;">${e.title}</span>
            <span style="color: rgba(255,255,255,0.5); font-size: 0.9em;">${new Date(e.date).toLocaleDateString()}</span>
        </div>
    `).join('');
}

// Show sections
function showTodoSection() {
    showSection('todo');
    loadTodos();
}

function showNotesSection() {
    showSection('notes');
    loadNotes();
}

// ============ CALCULATOR MODULE ============

let calcExpression = '';

function calcAppend(val) {
    calcExpression += val;
    document.getElementById('calc-display').value = calcExpression;
}

function calcClear() {
    calcExpression = '';
    document.getElementById('calc-display').value = '';
}

function calcEqual() {
    try {
        const result = eval(calcExpression);
        document.getElementById('calc-display').value = result;
        calcExpression = result.toString();
    } catch (e) {
        document.getElementById('calc-display').value = 'Error';
        calcExpression = '';
    }
}

// ============ TIMER MODULE ============

let timerInterval = null;
let timerSeconds = 25 * 60; // 25 minutes default
let timerRunning = false;

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    document.getElementById('timer-display').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function timerSet(minutes) {
    timerPause();
    timerSeconds = minutes * 60;
    updateTimerDisplay();
}

function timerStart() {
    if (timerRunning) return;
    
    timerRunning = true;
    document.getElementById('timer-start-btn').style.display = 'none';
    document.getElementById('timer-pause-btn').style.display = 'inline-block';
    
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            timerPause();
            showToast('Timer selesai!', 'success');
            // Play notification sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onpl5Y2RsdH2Lk4p8bW10e4mNgoJ8b3B2fImLhoGAfnJzc3uHjoaBf3t7e3yEjYWEgH5+fX19hY2GhoGAf359fX2EjYeHgoF+fX19fYSMh4aBgH9+fX19g4yHhoGAf359fX2DjIeGgYB/fn19fYOMh4aBgH9+fX19g4yHhoGAf359fX2DjIeGgYB/fn19fYOMh4aBgH9+fX19g4yHhoGAf359fX2DjIeGgYB/fn19fYOMh4aBgH9+fX19g4yHhoGAf359fX2DjIeGgYB/fn19fYOMh4aBgH9+fX19g4yHhoGAf359fX2DjIeGgYB/fn19fYOMh4aBgH59fX19g4yHhoGAfn59fX2DjIeGgYB+fn19fYKMh4aBgH5+fX19goyHhoGAfn59fX2CjIeGgYB+fn19fYKMh4aBgH5+fX19goyHhoGAfn59fX2CjIeGgYB+fn19fYKMh4aBgH5+fX19gYmJiA==');
            audio.play().catch(() => {});
        }
    }, 1000);
}

function timerPause() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.getElementById('timer-start-btn').style.display = 'inline-block';
    document.getElementById('timer-pause-btn').style.display = 'none';
}

function timerReset() {
    timerPause();
    timerSeconds = 25 * 60;
    updateTimerDisplay();
}

// ============ BACKGROUND SETTINGS MODULE ============

const defaultBgUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=3840&q=80';

function changeBackground() {
    const url = document.getElementById('bg-url').value.trim();
    if (!url) {
        showToast('Masukkan URL gambar terlebih dahulu!', 'error');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        showToast('URL tidak valid!', 'error');
        return;
    }
    
    setBackground(url);
    showToast('Background berhasil diganti!', 'success');
}

function changeBackgroundPreset(url) {
    setBackground(url);
    showToast('Background berhasil diganti!', 'success');
}

function setBackground(url) {
    const bg = document.querySelector('.anime-background');
    // Also set body background
    document.body.style.backgroundImage = `url('${url}')`;
    
    if (bg) {
        const encodedUrl = encodeURI(url);
        bg.style.background = `linear-gradient(180deg, rgba(10, 10, 26, 0.7) 0%, rgba(26, 26, 62, 0.7) 50%, rgba(13, 26, 45, 0.7) 100%), url("${encodedUrl}")`;
    }
    localStorage.setItem('customBgUrl', url);
}

function resetBackground() {
    setBackground(defaultBgUrl);
    localStorage.removeItem('customBgUrl');
    showToast('Background direset ke default!', 'success');
}

// Load custom background on page load
function loadCustomBackground() {
    const savedUrl = localStorage.getItem('customBgUrl');
    if (savedUrl) {
        setBackground(savedUrl);
    } else {
        // Set default body background
        document.body.style.backgroundImage = `url('${defaultBgUrl}')`;
    }
}
