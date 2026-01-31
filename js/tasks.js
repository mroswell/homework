// =============================================
// TASKS MODULE
// Handles checkbox state, progress tracking, and sync with database
// =============================================

let currentUser = null;

async function initializeTasks(user) {
    currentUser = user;
    
    if (!user) {
        console.log('No user, tasks not initialized');
        return;
    }
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-task-id]');
    
    if (checkboxes.length === 0) {
        console.log('No task checkboxes found on this page');
        return;
    }
    
    await loadProgress(checkboxes);
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    
    updateProgressCounter();
}

async function loadProgress(checkboxes) {
    const taskIds = Array.from(checkboxes).map(cb => cb.dataset.taskId);
    
    const { data: progress, error } = await db
        .from('progress')
        .select('task_id')
        .eq('user_id', currentUser.id)
        .in('task_id', taskIds);
    
    if (error) {
        console.error('Error loading progress:', error);
        return;
    }
    
    const completedTasks = new Set(progress.map(p => p.task_id));
    
    checkboxes.forEach(checkbox => {
        const taskId = checkbox.dataset.taskId;
        checkbox.checked = completedTasks.has(taskId);
        updateTaskVisual(checkbox);
    });
}

async function handleCheckboxChange(event) {
    const checkbox = event.target;
    const taskId = checkbox.dataset.taskId;
    const isChecked = checkbox.checked;
    
    checkbox.disabled = true;
    
    try {
        if (isChecked) {
            const { error } = await db
                .from('progress')
                .insert({
                    user_id: currentUser.id,
                    task_id: taskId
                });
            
            if (error) throw error;
        } else {
            const { error } = await db
                .from('progress')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('task_id', taskId);
            
            if (error) throw error;
        }
        
        updateTaskVisual(checkbox);
        updateProgressCounter();
        
    } catch (error) {
        console.error('Error saving progress:', error);
        checkbox.checked = !isChecked;
        alert('Error saving progress. Please try again.');
    } finally {
        checkbox.disabled = false;
    }
}

function updateTaskVisual(checkbox) {
    const taskItem = checkbox.closest('.task-item');
    if (taskItem) {
        if (checkbox.checked) {
            taskItem.classList.add('completed');
        } else {
            taskItem.classList.remove('completed');
        }
    }
}

function updateProgressCounter() {
    const counter = document.getElementById('progress-counter');
    if (!counter) return;
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-task-id]');
    const total = checkboxes.length;
    const completed = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    counter.textContent = `${completed} of ${total} completed`;
    
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
    }
}
