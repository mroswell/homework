// =============================================
// DASHBOARD MODULE
// Instructor-only progress reporting and student management
// =============================================

async function initializeDashboard(user) {
    if (!user) {
        window.location.href = '/';
        return;
    }
    
    if (!user.isInstructor) {
        alert('Access denied. Instructor privileges required.');
        window.location.href = '/homework-2';
        return;
    }
    
    await Promise.all([
        loadProgressMatrix(),
        loadStudentList()
    ]);
    
    setupAddStudentForm();
}

async function loadProgressMatrix() {
    const container = document.getElementById('progress-matrix');
    if (!container) return;
    
    container.innerHTML = '<p class="loading">Loading progress data...</p>';
    
    try {
        const { data: progress, error: progressError } = await supabase
            .rpc('get_all_progress');
        
        if (progressError) throw progressError;
        
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .order('page_slug')
            .order('display_order');
        
        if (tasksError) throw tasksError;
        
        const { data: students, error: studentsError } = await supabase
            .rpc('get_all_students');
        
        if (studentsError) throw studentsError;
        
        const studentList = students.filter(s => !s.is_instructor);
        
        if (studentList.length === 0) {
            container.innerHTML = '<p>No students found. Add students using the form below.</p>';
            return;
        }
        
        if (tasks.length === 0) {
            container.innerHTML = '<p>No tasks found. Add tasks to the database.</p>';
            return;
        }
        
        const progressLookup = {};
        progress.forEach(p => {
            progressLookup[`${p.student_email}|${p.task_id}`] = p.completed_at;
        });
        
        const tasksByPage = {};
        tasks.forEach(task => {
            if (!tasksByPage[task.page_slug]) {
                tasksByPage[task.page_slug] = [];
            }
            tasksByPage[task.page_slug].push(task);
        });
        
        let html = '<table class="progress-table">';
        
        html += '<thead><tr><th>Student</th>';
        Object.keys(tasksByPage).forEach(pageSlug => {
            const pageTasks = tasksByPage[pageSlug];
            html += `<th colspan="${pageTasks.length}" class="page-header">${formatPageSlug(pageSlug)}</th>`;
        });
        html += '<th>Total</th></tr>';
        
        html += '<tr><th></th>';
        tasks.forEach(task => {
            html += `<th class="task-header" title="${task.title}">${truncate(task.title, 20)}</th>`;
        });
        html += '<th></th></tr></thead>';
        
        html += '<tbody>';
        studentList.forEach(student => {
            let completedCount = 0;
            html += `<tr><td class="student-name">${student.name}</td>`;
            
            tasks.forEach(task => {
                const key = `${student.email}|${task.id}`;
                const isCompleted = progressLookup[key];
                
                if (isCompleted) {
                    completedCount++;
                    const date = new Date(isCompleted).toLocaleDateString();
                    html += `<td class="completed" title="Completed ${date}">✓</td>`;
                } else {
                    html += `<td class="incomplete">—</td>`;
                }
            });
            
            const percentage = Math.round((completedCount / tasks.length) * 100);
            html += `<td class="total">${completedCount}/${tasks.length} (${percentage}%)</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        const totalPossible = studentList.length * tasks.length;
        const totalCompleted = progress.length;
        const overallPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        
        html += `<div class="summary">
            <p><strong>Overall Progress:</strong> ${totalCompleted} of ${totalPossible} tasks completed (${overallPercentage}%)</p>
            <p><strong>Students:</strong> ${studentList.length} | <strong>Tasks:</strong> ${tasks.length}</p>
        </div>`;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading progress:', error);
        container.innerHTML = `<p class="error">Error loading progress: ${error.message}</p>`;
    }
}

async function loadStudentList() {
    const container = document.getElementById('student-list');
    if (!container) return;
    
    try {
        const { data: students, error } = await supabase
            .rpc('get_all_students');
        
        if (error) throw error;
        
        let html = '<ul class="student-management-list">';
        students.forEach(student => {
            const badge = student.is_instructor ? '<span class="badge instructor">Instructor</span>' : '';
            html += `
                <li>
                    <span class="student-info">
                        <strong>${student.name}</strong> ${badge}<br>
                        <small>${student.email}</small>
                    </span>
                    <button class="btn-remove" data-email="${student.email}" title="Remove">✕</button>
                </li>`;
        });
        html += '</ul>';
        
        container.innerHTML = html;
        
        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', handleRemoveStudent);
        });
        
    } catch (error) {
        console.error('Error loading students:', error);
        container.innerHTML = `<p class="error">Error loading students: ${error.message}</p>`;
    }
}

async function handleRemoveStudent(event) {
    const email = event.target.dataset.email;
    
    if (!confirm(`Are you sure you want to remove ${email}? Their progress will be preserved but they won't be able to log in.`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .rpc('remove_approved_email', { remove_email: email });
        
        if (error) throw error;
        
        await Promise.all([
            loadStudentList(),
            loadProgressMatrix()
        ]);
        
    } catch (error) {
        console.error('Error removing student:', error);
        alert('Error removing student: ' + error.message);
    }
}

function setupAddStudentForm() {
    const form = document.getElementById('add-student-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('new-student-name');
        const emailInput = document.getElementById('new-student-email');
        const instructorCheckbox = document.getElementById('new-student-instructor');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const isInstructor = instructorCheckbox?.checked || false;
        
        if (!name || !email) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';
        
        try {
            const { error } = await supabase
                .rpc('add_approved_email', {
                    new_email: email,
                    new_name: name,
                    make_instructor: isInstructor
                });
            
            if (error) throw error;
            
            nameInput.value = '';
            emailInput.value = '';
            if (instructorCheckbox) instructorCheckbox.checked = false;
            
            await Promise.all([
                loadStudentList(),
                loadProgressMatrix()
            ]);
            
        } catch (error) {
            console.error('Error adding student:', error);
            alert('Error adding student: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Student';
        }
    });
}

function formatPageSlug(slug) {
    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1) + '…';
}

async function exportProgressCSV() {
    try {
        const { data: progress, error } = await supabase
            .rpc('get_all_progress');
        
        if (error) throw error;
        
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .order('page_slug')
            .order('display_order');
        
        const { data: students } = await supabase
            .rpc('get_all_students');
        
        const studentList = students.filter(s => !s.is_instructor);
        
        const progressLookup = {};
        progress.forEach(p => {
            progressLookup[`${p.student_email}|${p.task_id}`] = p.completed_at;
        });
        
        let csv = 'Student Name,Student Email,' + tasks.map(t => `"${t.title.replace(/"/g, '""')}"`).join(',') + '\n';
        
        studentList.forEach(student => {
            const row = [
                `"${student.name}"`,
                `"${student.email}"`
            ];
            
            tasks.forEach(task => {
                const key = `${student.email}|${task.id}`;
                row.push(progressLookup[key] ? '1' : '0');
            });
            
            csv += row.join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting: ' + error.message);
    }
}
