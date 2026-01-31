// =============================================
// DASHBOARD MODULE
// =============================================

async function initializeDashboard(user) {
    if (!user || !user.isInstructor) {
        alert('Access denied. Instructor privileges required.');
        window.location.href = '/';
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
    
    container.innerHTML = '<p class="loading">Loading...</p>';
    
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
            container.innerHTML = '<p>No students yet. Add them below.</p>';
            return;
        }
        
        if (tasks.length === 0) {
            container.innerHTML = '<p>No tasks yet. Tasks are created when students visit homework pages.</p>';
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
        
        let html = '<table class="progress-table"><thead><tr><th>Student</th>';
        Object.keys(tasksByPage).forEach(pageSlug => {
            const pageTasks = tasksByPage[pageSlug];
            html += `<th colspan="${pageTasks.length}" class="page-header">${pageSlug}</th>`;
        });
        html += '<th>Total</th></tr>';
        
        html += '<tr><th></th>';
        tasks.forEach(task => {
            html += `<th class="task-header" title="${task.title}">${task.title.substring(0, 15)}...</th>`;
        });
        html += '<th></th></tr></thead><tbody>';
        
        studentList.forEach(student => {
            let completedCount = 0;
            html += `<tr><td class="student-name">${student.name}</td>`;
            
            tasks.forEach(task => {
                const key = `${student.email}|${task.id}`;
                if (progressLookup[key]) {
                    completedCount++;
                    html += `<td class="completed">✓</td>`;
                } else {
                    html += `<td class="incomplete">—</td>`;
                }
            });
            
            const pct = Math.round((completedCount / tasks.length) * 100);
            html += `<td class="total">${completedCount}/${tasks.length} (${pct}%)</td></tr>`;
        });
        html += '</tbody></table>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

async function loadStudentList() {
    const container = document.getElementById('student-list');
    if (!container) return;
    
    try {
        const { data: students, error } = await supabase.rpc('get_all_students');
        if (error) throw error;
        
        let html = '<ul class="student-management-list">';
        students.forEach(student => {
            const badge = student.is_instructor ? '<span class="badge instructor">Instructor</span>' : '';
            html += `<li>
                <span class="student-info"><strong>${student.name}</strong> ${badge}<br><small>${student.email}</small></span>
                <button class="btn-remove" data-email="${student.email}">✕</button>
            </li>`;
        });
        html += '</ul>';
        
        container.innerHTML = html;
        
        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const email = e.target.dataset.email;
                if (!confirm(`Remove ${email}?`)) return;
                
                const { error } = await supabase.rpc('remove_approved_email', { remove_email: email });
                if (error) alert('Error: ' + error.message);
                else {
                    await loadStudentList();
                    await loadProgressMatrix();
                }
            });
        });
        
    } catch (error) {
        container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

function setupAddStudentForm() {
    const form = document.getElementById('add-student-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('new-student-name').value.trim();
        const email = document.getElementById('new-student-email').value.trim();
        const isInstructor = document.getElementById('new-student-instructor')?.checked || false;
        
        if (!name || !email) return;
        
        try {
            const { error } = await supabase.rpc('add_approved_email', {
                new_email: email,
                new_name: name,
                make_instructor: isInstructor
            });
            
            if (error) throw error;
            
            form.reset();
            await loadStudentList();
            await loadProgressMatrix();
            
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

async function exportProgressCSV() {
    try {
        const { data: progress } = await supabase.rpc('get_all_progress');
        const { data: tasks } = await supabase.from('tasks').select('*').order('page_slug').order('display_order');
        const { data: students } = await supabase.rpc('get_all_students');
        
        const studentList = students.filter(s => !s.is_instructor);
        const progressLookup = {};
        progress.forEach(p => { progressLookup[`${p.student_email}|${p.task_id}`] = true; });
        
        let csv = 'Name,Email,' + tasks.map(t => `"${t.title}"`).join(',') + '\n';
        studentList.forEach(s => {
            csv += `"${s.name}","${s.email}",` + tasks.map(t => progressLookup[`${s.email}|${t.id}`] ? '1' : '0').join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `progress-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
