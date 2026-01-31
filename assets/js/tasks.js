// =============================================
// TASKS MODULE - SIMPLIFIED
// Auto-creates tasks in database from page content
// =============================================

let currentUser = null;

// Initialize tasks - auto-creates any new tasks in database
async function initializeTasks(user, pageId) {
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
    
    // Gather task info from the page and ensure they exist in database
    const tasksFromPage = [];
    checkboxes.forEach((checkbox, index) => {
        const taskItem = checkbox.closest('.task-item');
        tasksFromPage.push({
            id: checkbox.dataset.taskId,
            page_slug: pageId,
            title: taskItem?.dataset.taskTitle || checkbox.dataset.taskId,
            display_order: parseInt(taskItem?.dataset.taskOrder) || index + 1
        });
    });
    
    // Sync tasks to database (creates if not exists)
    await syncTasks(tasksFromPage);
    
    // Load existing progress
    await loadProgress(checkboxes);
    
    // Add event listeners
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    
    updateProgressCounter();
}

// Sync tasks to database - creates any that don't exist
async function syncTasks(tasks) {
    for (const task of tasks) {
        const { error } = await db
            .from('tasks')
            .upsert({
                id: task.id,
                page_slug: task.page_slug,
                title: task.title,
                display_order: task.display_order
            }, { 
                onConflict: 'id',
                ignoreDuplicates: true 
            });
        
        if (error && !error.message.includes('duplicate')) {
            console.error('Error syncing task:', task.id, error);
        }
    }
}

// Load user's progress from database
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

// Handle checkbox change
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

// Update visual styling
function updateTaskVisual(checkbox) {
    const taskItem = checkbox.closest('.task-item');
    if (taskItem) {
        taskItem.classList.toggle('completed', checkbox.checked);
    }
}

// Update progress counter
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
    }
}
