// =============================================
// AUTHENTICATION MODULE
// =============================================

// Only reload once after magic link callback
if (window.location.hash.includes('access_token')) {
    window.location.hash = '';
    window.location.reload();
}

// Check if user is logged in and authorized
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('Auth error:', error);
        return null;
    }
    
    if (!session) {
        return null;
    }
    
    // Get user info from approved_emails
    const { data: userInfo, error: userError } = await supabase
        .rpc('get_approved_user_info', { check_email: session.user.email });
    
    if (userError || !userInfo || userInfo.length === 0) {
        console.error('User not in approved list');
        await supabase.auth.signOut();
        return null;
    }
    
    return {
        id: session.user.id,
        email: session.user.email,
        name: userInfo[0].name,
        isInstructor: userInfo[0].is_instructor
    };
}

// Send magic link to email
async function sendMagicLink(email) {
    const { data: isApproved, error: checkError } = await supabase
        .rpc('is_email_approved', { check_email: email });
    
    if (checkError) {
        throw new Error('Error checking email. Please try again.');
    }
    
    if (!isApproved) {
        throw new Error('This email is not on the approved list. Please contact your instructor.');
    }
    
    const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: window.location.origin + window.location.pathname
        }
    });
    
    if (error) {
        throw new Error(error.message);
    }
    
    return true;
}

// Sign out
async function signOut() {
    await supabase.auth.signOut();
    window.location.href = window.location.origin + '/';
}

// Update UI based on auth state
async function updateAuthUI() {
    const user = await checkAuth();
    
    const loginSection = document.getElementById('login-section');
    const contentSection = document.getElementById('content-section');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const dashboardLink = document.getElementById('dashboard-link');
    
    if (user) {
        if (loginSection) loginSection.style.display = 'none';
        if (contentSection) contentSection.style.display = 'block';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = user.name;
        if (dashboardLink) {
            dashboardLink.style.display = user.isInstructor ? 'inline' : 'none';
        }
        return user;
    } else {
        if (loginSection) loginSection.style.display = 'block';
        if (contentSection) contentSection.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        return null;
    }
}

// Handle login form submission
function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;
    
    const emailInput = document.getElementById('email-input');
    const submitBtn = document.getElementById('submit-btn');
    const message = document.getElementById('login-message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        if (!email) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        message.textContent = '';
        message.className = 'message';
        
        try {
            await sendMagicLink(email);
            message.textContent = '✓ Magic link sent! Check your email and click the link to sign in.';
            message.className = 'message success';
            emailInput.value = '';
        } catch (error) {
            message.textContent = '✗ ' + error.message;
            message.className = 'message error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Magic Link';
        }
    });
}
