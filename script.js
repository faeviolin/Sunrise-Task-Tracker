// Timer functionality
let timeLeft = 10 * 60; // 10 minutes in seconds
let timerId = null;
let isTimerRunning = false;
let completionState = {};
let isMusicPlaying = false;
let isEditingTimer = false;
let lastTimestamp = 0;
let timerStartTime = 0;

// Add these variables at the top
let savedTimerState = JSON.parse(localStorage.getItem('timerState') || '{}');
timeLeft = savedTimerState.timeLeft || 10 * 60;
isTimerRunning = savedTimerState.isTimerRunning || false;
timerStartTime = savedTimerState.timerStartTime || 0;

const timerDisplay = document.querySelector('.timer');
const startTimerButton = document.getElementById('startTimer');
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTask');
const tasksList = document.getElementById('tasksList');
const toggleMusicButton = document.getElementById('toggleMusic');
const memoInput = document.getElementById('memoInput');
const addMemoButton = document.getElementById('addMemo');
const memosList = document.getElementById('memosList');
const gridCells = document.querySelectorAll('.grid-cell');
const completedTasksCounter = document.getElementById('completedTasksCounter');
const clearSunsButton = document.getElementById('clearSuns');

// Show that timer is editable when inactive
timerDisplay.classList.add('inactive');

// Sound effects
const audio = new Audio('Assets/round1.mp3');
audio.loop = true;

// Timer completion sound
const timerEndSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');

// Pop sound effect for grid cells - using a local file
const popSound = new Audio('Assets/pop-clean-312648.mp3');
popSound.volume = 0.7; // Adjust volume as needed

// Sketch pad functionality
const canvas = document.getElementById('sketchCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let points = [];
const resetSketchButton = document.getElementById('resetSketch');

// Add focus input persistence
const focusInput = document.querySelector('.focus-input');

// Load saved focus
focusInput.value = localStorage.getItem('dailyFocus') || '';

// Save focus when it changes
focusInput.addEventListener('input', () => {
    localStorage.setItem('dailyFocus', focusInput.value);
});

// Load completion state from localStorage
function loadCompletionState() {
    const savedState = localStorage.getItem('completionState');
    if (savedState) {
        completionState = JSON.parse(savedState);
        // Update grid cells based on saved state
        gridCells.forEach(cell => {
            const cellId = cell.dataset.cellId;
            if (completionState[cellId]) {
                cell.classList.add('filled');
                cell.innerHTML = '☀️'; // Sun emoji instead of heart
            }
        });
    }
}

// Save completion state to localStorage
function saveCompletionState() {
    localStorage.setItem('completionState', JSON.stringify(completionState));
}

// Add event listeners to grid cells
gridCells.forEach(cell => {
    cell.addEventListener('click', () => {
        const cellId = cell.dataset.cellId;
        if (completionState[cellId]) {
            // If already filled, empty it
            delete completionState[cellId];
            cell.classList.remove('filled');
            cell.innerHTML = '';
            // No sound when removing suns
        } else {
            // If empty, fill it
            completionState[cellId] = true;
            cell.classList.add('filled');
            cell.innerHTML = '☀️'; // Sun emoji
            // Play pop sound when adding suns
            popSound.currentTime = 0;
            popSound.play().catch(error => {
                console.error("Pop sound play failed:", error);
                alert("Pop sound failed to play. Please check the sound file.");
            });
        }
        saveCompletionState();
    });
});

// Add click handler for Clear Suns button
clearSunsButton.addEventListener('click', () => {
    // Clear all suns from the grid
    gridCells.forEach(cell => {
        cell.classList.remove('filled');
        cell.innerHTML = '';
    });
    
    // Reset completion state
    completionState = {};
    saveCompletionState();
});

// Music toggle button
toggleMusicButton.addEventListener('click', () => {
    isMusicPlaying = !isMusicPlaying;
    if (isMusicPlaying) {
        audio.play().catch(error => {
            console.error("Audio play failed:", error);
            alert("Music playback failed. Please make sure the audio file exists.");
        });
        toggleMusicButton.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
        audio.pause();
        toggleMusicButton.innerHTML = '<i class="fas fa-music"></i>';
    }
});

// Timer functions
function updateTimerDisplay() {
    if (!isEditingTimer) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function saveTimerState() {
    localStorage.setItem('timerState', JSON.stringify({
        timeLeft,
        isTimerRunning,
        timerStartTime
    }));
}

function startTimer() {
    if (isEditingTimer) return;
    
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerDisplay.classList.remove('inactive');
        startTimerButton.textContent = 'Pause';
        timerStartTime = Date.now() - ((10 * 60 - timeLeft) * 1000);
        requestAnimationFrame(updateTimer);
    } else {
        isTimerRunning = false;
        timerDisplay.classList.add('inactive');
        startTimerButton.textContent = 'Start';
    }
    saveTimerState();
}

function updateTimer(timestamp) {
    if (!isTimerRunning) return;
    
    const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
    timeLeft = Math.max(0, (10 * 60) - elapsedSeconds);
    
    if (timeLeft === 0) {
        isTimerRunning = false;
        timerDisplay.classList.add('inactive');
        startTimerButton.textContent = 'Start';
        timeLeft = 10 * 60;
        updateTimerDisplay();
        saveTimerState();
        
        // Play both sounds when timer ends
        popSound.currentTime = 0;
        popSound.play().catch(error => {
            console.error("Pop sound play failed:", error);
        });
        
        setTimeout(() => {
            timerEndSound.play().catch(error => {
                console.error("Timer sound play failed:", error);
            });
            alert('Time is up!');
        }, 50);
        
        return;
    }
    
    updateTimerDisplay();
    saveTimerState();
    requestAnimationFrame(updateTimer);
}

// Make timer editable
timerDisplay.addEventListener('click', () => {
    if (isTimerRunning) return; // Don't allow editing while timer is running
    
    isEditingTimer = true;
    
    // Create input for editing
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const timerInput = document.createElement('input');
    timerInput.type = 'text';
    timerInput.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerInput.className = 'timer-input';
    timerInput.style.cssText = `
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        width: 150px;
        background: transparent;
        border: none;
        outline: none;
        color: inherit;
    `;
    
    // Replace timer display with input
    timerDisplay.textContent = '';
    timerDisplay.appendChild(timerInput);
    timerInput.focus();
    timerInput.select();
    
    // Helper function to apply the new time
    const applyNewTime = () => {
        const timePattern = /^([0-5]?[0-9]):([0-5][0-9])$/;
        const match = timerInput.value.match(timePattern);
        
        if (match) {
            const newMinutes = parseInt(match[1]);
            const newSeconds = parseInt(match[2]);
            
            if (newMinutes <= 59) {
                timeLeft = (newMinutes * 60) + newSeconds;
                timerDisplay.textContent = `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
            } else {
                timeLeft = 10 * 60; // Reset to default if invalid
                timerDisplay.textContent = '10:00';
            }
        } else {
            timeLeft = 10 * 60; // Reset to default if invalid
            timerDisplay.textContent = '10:00';
        }
        
        isEditingTimer = false;
    };
    
    // Apply time when enter is pressed
    timerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyNewTime();
        }
    });
    
    // Apply time when focus is lost
    timerInput.addEventListener('blur', applyNewTime);
});

// Task management
class Task {
    constructor(text, isSubtask = false, parentId = null, completed = false, id = null) {
        this.id = id || Date.now() + Math.floor(Math.random() * 1000);
        this.text = text;
        this.completed = completed;
        this.isSubtask = isSubtask;
        this.parentId = parentId;
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'task-wrapper';
        this.wrapper.dataset.taskId = this.id;
        
        if (this.isSubtask) {
            this.wrapper.classList.add('is-subtask');
        }
        
        this.element = this.createTaskElement();
        this.wrapper.appendChild(this.element);
        
        // Add double-click event listener for editing
        this.element.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('task-content')) {
                this.startEditing(e.target);
            }
        });
    }

    createTaskElement() {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.draggable = true;
        
        if (this.isSubtask) {
            taskDiv.classList.add('is-subtask');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = this.completed;
        
        // Apply opacity based on completion status
        if (this.completed) {
            taskDiv.style.opacity = '0.6';
        }
        
        checkbox.addEventListener('change', () => {
            this.completed = checkbox.checked;
            taskDiv.style.opacity = this.completed ? '0.6' : '1';
            
            // Play pop sound when a task is checked (not when unchecked)
            if (this.completed) {
                popSound.currentTime = 0;
                popSound.play().catch(error => {
                    console.error("Pop sound play failed:", error);
                });
            }
            
            saveTasks();
            updateCompletedTasksCounter();
        });

        const content = document.createElement('div');
        content.className = 'task-content';
        content.textContent = this.text;

        const collapseButton = document.createElement('button');
        collapseButton.className = 'task-collapse';
        collapseButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
        collapseButton.style.display = 'none'; // Hidden by default
        collapseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSubtasks();
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'task-delete';
        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
        deleteButton.addEventListener('click', () => {
            // Find and remove this task
            tasks = tasks.filter(t => t.id !== this.id);
            
            // If we're deleting a parent task, make its subtasks top-level tasks
            const subtasks = tasks.filter(t => t.parentId === this.id);
            subtasks.forEach(subtask => {
                subtask.isSubtask = false;
                subtask.parentId = null;
                subtask.wrapper.classList.remove('is-subtask');
                subtask.element.classList.remove('is-subtask');
            });
            
            // If this is a subtask, update parent's buttons
            if (this.isSubtask && this.parentId) {
                updateParentTaskButtons(this.parentId);
            }
            
            this.wrapper.remove();
            saveTasks();
            updateCompletedTasksCounter();
        });

        taskDiv.appendChild(checkbox);
        taskDiv.appendChild(content);
        
        // Only add collapse button to main tasks
        if (!this.isSubtask) {
            taskDiv.appendChild(collapseButton);
        }
        
        // Add delete button to all tasks
        taskDiv.appendChild(deleteButton);

        // Drag and drop functionality for vertical reordering and subtask creation
        let startX = 0;
        let startY = 0;
        
        taskDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', this.id);
            taskDiv.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
        });

        taskDiv.addEventListener('dragend', (e) => {
            taskDiv.classList.remove('dragging');
            const deltaX = e.clientX - startX;
            
            // If dragged significantly to the right and there's a task above, make it a subtask
            if (deltaX > 50 && !this.isSubtask) {
                const taskWrapper = this.wrapper;
                const previousWrapper = taskWrapper.previousElementSibling;
                
                if (previousWrapper && previousWrapper.classList.contains('task-wrapper')) {
                    const parentId = parseInt(previousWrapper.dataset.taskId);
                    const parentTask = tasks.find(t => t.id === parentId);
                    
                    if (parentTask) {
                        // Make this task a subtask of the previous task
                        this.isSubtask = true;
                        this.parentId = parentId;
                        this.wrapper.classList.add('is-subtask');
                        this.element.classList.add('is-subtask');
                        
                        // Remove only the collapse button
                        const collapseBtn = this.element.querySelector('.task-collapse');
                        if (collapseBtn) collapseBtn.remove();
                        
                        // Update parent's buttons
                        updateParentTaskButtons(parentId);
                        
                        saveTasks();
                    }
                }
            }
            
            // If dragged significantly to the left and it's a subtask, make it a standalone task
            if (deltaX < -50 && this.isSubtask) {
                const oldParentId = this.parentId;
                this.isSubtask = false;
                this.parentId = null;
                this.wrapper.classList.remove('is-subtask');
                this.element.classList.remove('is-subtask');
                
                // Add the collapse button back
                const collapseButton = document.createElement('button');
                collapseButton.className = 'task-collapse';
                collapseButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
                collapseButton.style.display = 'none';
                collapseButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSubtasks();
                });
                
                // Insert collapse button before delete button if it exists, otherwise append it
                const deleteBtn = this.element.querySelector('.task-delete');
                if (deleteBtn) {
                    this.element.insertBefore(collapseButton, deleteBtn);
                } else {
                    this.element.appendChild(collapseButton);
                    
                    // Add delete button if it doesn't exist
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'task-delete';
                    deleteButton.innerHTML = '<i class="fas fa-times"></i>';
                    deleteButton.addEventListener('click', () => {
                        tasks = tasks.filter(t => t.id !== this.id);
                        this.wrapper.remove();
                        saveTasks();
                    });
                    this.element.appendChild(deleteButton);
                }
                
                // Update old parent's buttons
                if (oldParentId) {
                    updateParentTaskButtons(oldParentId);
                }
                
                saveTasks();
            }
        });

        taskDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElem = document.querySelector('.dragging');
            
            if (draggingElem && draggingElem !== taskDiv) {
                const rect = this.wrapper.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                // Only allow vertical reordering
                if (e.clientY < midY) {
                    tasksList.insertBefore(findTaskWrapper(draggingElem), this.wrapper);
                } else {
                    if (this.wrapper.nextElementSibling) {
                        tasksList.insertBefore(findTaskWrapper(draggingElem), this.wrapper.nextElementSibling);
                    } else {
                        tasksList.appendChild(findTaskWrapper(draggingElem));
                    }
                }
            }
        });

        return taskDiv;
    }
    
    toggleSubtasks() {
        const subtasks = tasks.filter(t => t.parentId === this.id);
        const collapseBtn = this.element.querySelector('.task-collapse i');
        const isCollapsed = this.wrapper.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            this.wrapper.classList.remove('collapsed');
            collapseBtn.className = 'fas fa-chevron-down';
            subtasks.forEach(subtask => {
                subtask.wrapper.style.display = 'block';
            });
        } else {
            // Collapse
            this.wrapper.classList.add('collapsed');
            collapseBtn.className = 'fas fa-chevron-right';
            subtasks.forEach(subtask => {
                subtask.wrapper.style.display = 'none';
            });
        }
        
        // Save collapse state
        saveCollapseState();
    }
    
    startEditing(contentElement) {
        const currentText = contentElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'task-edit-input';
        input.style.cssText = `
            width: 100%;
            padding: 0.2rem;
            border: none;
            border-radius: 5px;
            font-size: inherit;
            font-family: inherit;
            background: white;
            outline: none;
        `;
        
        contentElement.textContent = '';
        contentElement.appendChild(input);
        input.focus();
        
        const finishEditing = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                this.text = newText;
                contentElement.textContent = newText;
                saveTasks();
            } else {
                contentElement.textContent = currentText;
            }
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEditing();
            }
        });
        
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                contentElement.textContent = currentText;
            }
        });
    }
}

function findTaskWrapper(element) {
    // Find the task-wrapper parent of an element
    while (element && !element.classList.contains('task-wrapper')) {
        element = element.parentElement;
    }
    return element;
}

// Memo management
class Memo {
    constructor(text, index = 0) {
        this.text = text;
        this.index = index;
        this.isEven = index % 2 === 0;  // Set even/odd status based on initial index
        this.element = this.createMemoElement();
        this.isEditing = false;
    }

    createMemoElement() {
        const memoDiv = document.createElement('div');
        memoDiv.className = 'memo-item';
        memoDiv.draggable = true;

        // Update alignment and color based on original even/odd status
        this.updateColorAndAlignment(memoDiv);

        const content = document.createElement('div');
        content.className = 'memo-content';
        content.textContent = this.text;

        // Make content editable when clicked
        content.addEventListener('click', () => {
            if (!this.isEditing && !memoDiv.classList.contains('dragging')) {
                this.startEditing();
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'memo-delete';
        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
        deleteButton.addEventListener('click', () => {
            memos = memos.filter(m => m !== this);
            memoDiv.remove();
            saveMemos();
            updateMemoIndices(); // Update indices after deletion
        });

        // Drag and drop for memos
        memoDiv.addEventListener('dragstart', (e) => {
            if (this.isEditing) {
                e.preventDefault();
                return;
            }
            memoDiv.classList.add('dragging');
            e.dataTransfer.setData('text/plain', memos.indexOf(this).toString());
            
            // Add a timeout to enhance the drag visual effect
            setTimeout(() => {
                memoDiv.style.opacity = '0.7';
                memoDiv.style.transform = 'scale(1.02)';
            }, 0);
        });

        memoDiv.addEventListener('dragend', () => {
            memoDiv.classList.remove('dragging');
            memoDiv.style.opacity = '';
            memoDiv.style.transform = '';
            
            // Update all memo positions after dragging ends
            updateMemoIndices();
            saveMemos();
        });

        memoDiv.appendChild(content);
        memoDiv.appendChild(deleteButton);
        return memoDiv;
    }
    
    updateColorAndAlignment(element) {
        // Set alignment based on original even/odd status, not current index
        if (this.isEven) {
            element.style.marginLeft = '0';
            element.style.marginRight = 'auto';
        } else {
            element.style.marginLeft = 'auto';
            element.style.marginRight = '0';
        }
        
        // Set color based on original even/odd status
        if (this.isEven) {
            element.style.backgroundColor = 'var(--light-green)';
        } else {
            element.style.backgroundColor = 'var(--light-blue)';
        }
    }

    startEditing() {
        this.isEditing = true;
        const content = this.element.querySelector('.memo-content');
        const currentText = content.textContent;
        const currentHeight = content.offsetHeight;
        
        // Store the window's current scroll position
        const windowScrollY = window.scrollY;
        
        // Store click coordinates
        const clickEvent = window.event;
        const clickX = clickEvent ? clickEvent.offsetX : null;
        const clickY = clickEvent ? clickEvent.offsetY : null;
        
        const textarea = document.createElement('textarea');
        textarea.className = 'memo-edit-input';
        textarea.value = currentText;
        textarea.style.height = `${currentHeight}px`;
        textarea.style.minHeight = `${currentHeight}px`;
        
        content.innerHTML = '';
        content.appendChild(textarea);
        
        // Restore the window's scroll position
        window.scrollTo(0, windowScrollY);
        
        // Focus without scrolling into view and position cursor
        setTimeout(() => {
            textarea.focus({preventScroll: true});
            
            if (clickX !== null && clickY !== null) {
                // Get the approximate characters per line
                const textareaWidth = textarea.offsetWidth;
                const charWidth = 8; // Approximate width of a character in pixels
                const charsPerLine = Math.floor(textareaWidth / charWidth);
                
                // Get clicked line based on Y position
                const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
                const clickedLine = Math.floor(clickY / lineHeight);
                
                // Get approximate character position in line based on X position
                const clickedChar = Math.floor(clickX / charWidth);
                
                // Calculate total position
                const lines = currentText.split('\n');
                let position = 0;
                
                // Add length of previous lines
                for (let i = 0; i < clickedLine && i < lines.length; i++) {
                    position += lines[i].length + 1; // +1 for newline
                }
                
                // Add position within current line
                if (clickedLine < lines.length) {
                    position += Math.min(clickedChar, lines[clickedLine].length);
                }
                
                // Set cursor position
                textarea.setSelectionRange(position, position);
            }
        }, 0);
        
        const finishEditing = () => {
            const newText = textarea.value.trim();
            if (newText) {
                this.text = newText;
                content.textContent = newText;
                content.style.height = 'auto';
                saveMemos();
            } else {
                content.textContent = currentText;
            }
            this.isEditing = false;
            this.element.draggable = true;
        };
        
        // Finish editing when enter is pressed without shift
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                content.textContent = currentText;
                this.isEditing = false;
                this.element.draggable = true;
            }
        });
        
        // Finish editing when textarea loses focus
        textarea.addEventListener('blur', finishEditing);
        
        // Temporarily disable dragging while editing
        this.element.draggable = false;
    }
}

// Add dragover listener to memos container
memosList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingMemo = document.querySelector('.memo-item.dragging');
    if (!draggingMemo) return;
    
    const afterElement = getDragAfterElement(memosList, e.clientY);
    if (afterElement == null) {
        memosList.appendChild(draggingMemo);
    } else {
        memosList.insertBefore(draggingMemo, afterElement);
    }
});

// Helper function to determine where to insert dragged memo
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.memo-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Function to update memo indices after drag/drop or deletion
function updateMemoIndices() {
    const memoElements = memosList.querySelectorAll('.memo-item');
    // Update the memos array to match the new order
    memos = Array.from(memoElements).map((element, index) => {
        const memoIndex = memos.findIndex(m => m.element === element);
        if (memoIndex !== -1) {
            memos[memoIndex].index = index; // Update position index
            return memos[memoIndex];
        }
    }).filter(Boolean); // Remove any undefined entries
    
    // Update alignment after reordering (but keep original colors)
    updateMemoAppearance();
}

// Function to update all memo appearances based on their current index
function updateMemoAppearance() {
    memos.forEach((memo) => {
        memo.updateColorAndAlignment(memo.element);
    });
}

// Drop event to finalize the order
memosList.addEventListener('drop', (e) => {
    e.preventDefault();
    updateMemoIndices();
});

// Local storage
let tasks = [];
let memos = [];

function saveTasks() {
    const tasksData = tasks.map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        isSubtask: task.isSubtask,
        parentId: task.parentId
    }));
    localStorage.setItem('tasks', JSON.stringify(tasksData));
}

function saveMemos() {
    const memosData = memos.map((memo, index) => ({
        text: memo.text,
        index: index,
        isEven: memo.isEven
    }));
    localStorage.setItem('memos', JSON.stringify(memosData));
}

function loadTasks() {
    const tasksData = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // First pass: create all tasks
    tasksData.forEach(taskData => {
        const task = new Task(
            taskData.text, 
            taskData.isSubtask || false,
            taskData.parentId || null,
            taskData.completed || false,
            taskData.id
        );
        
        tasks.push(task);
    });
    
    // Second pass: add them to the DOM in the correct order
    // First add parent tasks
    tasks.filter(task => !task.isSubtask).forEach(task => {
        tasksList.appendChild(task.wrapper);
        
        // Update buttons based on subtasks
        updateParentTaskButtons(task.id);
    });
    
    // Then add subtasks after their parent tasks
    tasks.filter(task => task.isSubtask).forEach(task => {
        const parentIndex = tasks.findIndex(t => t.id === task.parentId);
        if (parentIndex !== -1) {
            // Find the right position - directly after the parent
            const parentWrapper = tasks[parentIndex].wrapper;
            
            // Find the first non-subtask wrapper after the parent or the end
            let nextNonSubtask = parentWrapper.nextElementSibling;
            while (nextNonSubtask && nextNonSubtask.classList.contains('is-subtask')) {
                nextNonSubtask = nextNonSubtask.nextElementSibling;
            }
            
            if (nextNonSubtask) {
                tasksList.insertBefore(task.wrapper, nextNonSubtask);
            } else {
                tasksList.appendChild(task.wrapper);
            }
        } else {
            // If parent not found, make it a regular task
            task.isSubtask = false;
            task.parentId = null;
            task.wrapper.classList.remove('is-subtask');
            task.element.classList.remove('is-subtask');
            tasksList.appendChild(task.wrapper);
        }
    });
    
    // Load collapse state
    loadCollapseState();
    
    // Update counter after loading tasks
    updateCompletedTasksCounter();
}

function loadMemos() {
    const memosData = JSON.parse(localStorage.getItem('memos') || '[]');
    memosData.forEach((memoData, index) => {
        const memo = new Memo(memoData.text, index);
        // Preserve the original even/odd status if available
        if (memoData.isEven !== undefined) {
            memo.isEven = memoData.isEven;
            memo.updateColorAndAlignment(memo.element);
        }
        memos.push(memo);
        memosList.appendChild(memo.element);
    });
}

// Event listeners
startTimerButton.addEventListener('click', startTimer);

function addTask() {
    const text = taskInput.value.trim();
    if (text) {
        const task = new Task(text);
        tasks.push(task);
        tasksList.appendChild(task.wrapper);
        taskInput.value = '';
        saveTasks();
    }
}

function addMemo() {
    const text = memoInput.value.trim();
    if (text) {
        const currentIndex = memos.length;  // Get the current length as the new index
        const memo = new Memo(text, currentIndex);  // Pass the index to the constructor
        memos.push(memo);
        memosList.appendChild(memo.element);
        memoInput.value = '';
        saveMemos();
    }
}

addTaskButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

addMemoButton.addEventListener('click', addMemo);
memoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addMemo();
    }
});

// Add dragover handler to the tasks container to allow general dropping
tasksList.addEventListener('dragover', (e) => {
    e.preventDefault();
});

// Function to update completed tasks counter
function updateCompletedTasksCounter() {
    // Only count visible tasks that are checked
    const completedTasks = document.querySelectorAll('.task-checkbox:checked').length;
    completedTasksCounter.textContent = completedTasks;
    
    // Save the counter value to localStorage
    localStorage.setItem('completedTasksCount', completedTasks.toString());
}

// Set up the canvas
function setupCanvas() {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5; // Slightly thinner line for better precision
    ctx.strokeStyle = '#FF9F43'; // Use warm-orange color for drawing
    clearCanvas();
}

// Clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
}

// Reset button handler
resetSketchButton.addEventListener('click', clearCanvas);

// Start drawing
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    
    // Start new point collection for smoothing
    points = [];
    points.push({ x: lastX, y: lastY });
});

// Draw as mouse moves
canvas.addEventListener('mousemove', draw);

// Capture touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', () => {
    const mouseEvent = new MouseEvent('mouseup');
    canvas.dispatchEvent(mouseEvent);
});

// Handle drawing with smoothing
function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    points.push({ 
        x: currentX, 
        y: currentY,
        time: Date.now() 
    });
    
    if (points.length < 2) return;
    
    ctx.beginPath();
    
    if (points.length < 3) {
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
    } else {
        // Calculate velocity for dynamic control point adjustment
        const getVelocity = (p1, p2) => {
            const timeDiff = p2.time - p1.time || 1;
            const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            return distance / timeDiff;
        };
        
        // For each set of points, calculate a smooth curve with tension
        for (let i = 1; i < points.length - 2; i++) {
            // Calculate velocity for dynamic tension
            const velocity = getVelocity(points[i], points[i+1]);
            const tension = Math.min(0.5, 0.2 + (1 / (velocity + 1)) * 0.3);
            
            // Control points for the Bezier curve with dynamic tension
            const xc1 = points[i].x + (points[i+1].x - points[i-1].x) * tension;
            const yc1 = points[i].y + (points[i+1].y - points[i-1].y) * tension;
            const xc2 = points[i+1].x - (points[i+2].x - points[i].x) * tension;
            const yc2 = points[i+1].y - (points[i+2].y - points[i].y) * tension;
            
            // Draw a Bezier curve through these points
            ctx.bezierCurveTo(
                xc1, yc1,
                xc2, yc2,
                points[i+1].x, points[i+1].y
            );
        }
        
        // Connect to the last point with a quadratic curve
        const lastIndex = points.length - 1;
        const secondLastIndex = points.length - 2;
        
        if (points[lastIndex] && points[secondLastIndex]) {
            ctx.quadraticCurveTo(
                points[secondLastIndex].x, 
                points[secondLastIndex].y,
                points[lastIndex].x, 
                points[lastIndex].y
            );
        }
    }
    
    ctx.stroke();
    
    if (points.length > 25) {
        points = points.slice(-12);
    }
}

// Stop drawing
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    points = [];
});

canvas.addEventListener('mouseout', () => {
    isDrawing = false;
    points = [];
});

// Initialize
window.addEventListener('load', () => {
    setupCanvas();
    clearCanvas();
    
    // Resume timer if it was running
    if (isTimerRunning) {
        startTimerButton.textContent = 'Pause';
        timerDisplay.classList.remove('inactive');
        requestAnimationFrame(updateTimer);
    }
    updateTimerDisplay();
    loadTasks();
    loadMemos();
    loadCompletionState();
    updateCompletedTasksCounter();
});

// Add these functions after the Task class
function saveCollapseState() {
    const collapseState = tasks
        .filter(task => !task.isSubtask)
        .reduce((state, task) => {
            state[task.id] = task.wrapper.classList.contains('collapsed');
            return state;
        }, {});
    localStorage.setItem('taskCollapseState', JSON.stringify(collapseState));
}

function loadCollapseState() {
    const savedState = JSON.parse(localStorage.getItem('taskCollapseState') || '{}');
    tasks.forEach(task => {
        if (!task.isSubtask && savedState[task.id]) {
            task.wrapper.classList.add('collapsed');
            const collapseBtn = task.element.querySelector('.task-collapse i');
            if (collapseBtn) {
                collapseBtn.className = 'fas fa-chevron-right';
            }
            const subtasks = tasks.filter(t => t.parentId === task.id);
            subtasks.forEach(subtask => {
                subtask.wrapper.style.display = 'none';
            });
        }
    });
}

// Add this helper function after the Task class
function updateParentTaskButtons(parentId) {
    const parentTask = tasks.find(t => t.id === parentId);
    if (parentTask) {
        const hasSubtasks = tasks.some(t => t.parentId === parentId);
        const collapseBtn = parentTask.element.querySelector('.task-collapse');
        const deleteBtn = parentTask.element.querySelector('.task-delete');
        
        if (collapseBtn) {
            collapseBtn.style.display = hasSubtasks ? 'block' : 'none';
        }
        if (deleteBtn) {
            deleteBtn.style.display = hasSubtasks ? 'none' : 'block';
        }
    }
} 