// Auth Module
let currentAuthMode = 'login';

// Global helper function for authenticated fetch
window.authFetch = async function(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, { ...options, headers });
};

// Global logout function that will be called from main.js
async function logout() {
    try {
        await authFetch('/api/auth/logout', { method: 'POST' });
        // Clear token from localStorage
        localStorage.removeItem('token');
        showToast('Logout berhasil!', 'success');
        setTimeout(() => {
            showSection('home');
            updateNavigation(false);
        }, 1000);
    } catch (err) {
        console.error('Logout error:', err);
        // Still navigate to home even if API fails
        localStorage.removeItem('token');
        showSection('home');
        updateNavigation(false);
    }
}

function showAuth(mode) {
    currentAuthMode = mode;
    
    // Hide all sections first
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show auth section
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        authSection.classList.add('active');
    }
    
    // Update auth form based on mode
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const emailGroup = document.getElementById('email-group');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (mode === 'login') {
        title.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        subtitle.textContent = 'Masuk ke akun Anda';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        switchText.innerHTML = 'Belum punya akun? <a href="#" onclick="showAuth(\'register\')">Daftar sekarang</a>';
        if (emailGroup) emailGroup.style.display = 'none';
        if (usernameInput) usernameInput.placeholder = 'Username';
    } else {
        title.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        subtitle.textContent = 'Buat akun baru';
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
        switchText.innerHTML = 'Sudah punya akun? <a href="#" onclick="showAuth(\'login\')">Masuk di sini</a>';
        if (emailGroup) emailGroup.style.display = 'block';
        if (usernameInput) usernameInput.placeholder = 'Username';
    }
    
    // Clear form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.reset();
    }
}

async function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    
    if (!username || !password) {
        showToast('Username dan password wajib diisi!', 'error');
        return;
    }
    
    if (currentAuthMode === 'register' && !email) {
        showToast('Email wajib diisi untuk registrasi!', 'error');
        return;
    }
    
    showLoading();
    
    try {
        let endpoint, body;
        
        if (currentAuthMode === 'login') {
            endpoint = '/api/auth/login';
            body = { username, password };
        } else {
            endpoint = '/api/auth/register';
            body = { username, password, email };
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.success) {
            // Store token and user data for cross-origin requests
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            localStorage.setItem('welcomeShown', 'false');
            
            showToast(data.message, 'success');
            
            // Check user role and redirect
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    showAdminPanel();
                } else {
                    showDashboard(data.user);
                }
            }, 500);
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        hideLoading();
        showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
        console.error('Auth error:', err);
    }
}

async function checkAuth() {
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/auth/me', { headers });
        const data = await response.json();
        
        if (data.user) {
            if (data.user.role === 'admin') {
                showAdminPanel();
            } else {
                showDashboard(data.user);
            }
            updateNavigation(true, data.user);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Check auth error:', err);
        return false;
    }
}

// Initialize auth form when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }
});

// ============ WELCOME MESSAGE FEATURES ============

function showWelcomeMessage(user) {
    // Check if welcome message was already shown
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (welcomeShown === 'true') return;
    
    localStorage.setItem('welcomeShown', 'true');
    
    // Build welcome content
    const greeting = getTimeBasedGreeting();
    let welcomeContent = `
        <div style="text-align: center; padding: 10px;">
            <h2 style="margin: 0; color: #4CAF50; font-size: 20px;">
                <i class="fas fa-hand-wave"></i> ${greeting}, ${escapeHtml(user.username)}!
            </h2>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">Senang melihatmu kembali di aplikasi kami!</p>
        </div>
    `;
    
    // Show as toast
    showWelcomeToast(welcomeContent);
}

function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Selamat Pagi';
    if (hour >= 12 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

function showWelcomeToast(content) {
    // Remove existing welcome toast
    const existing = document.getElementById('welcome-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'welcome-toast';
    toast.className = 'toast toast-success';
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        min-width: 320px;
        max-width: 380px;
        z-index: 9999;
        animation: slideInRight 0.5s ease;
        cursor: pointer;
        background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
        border-left: 4px solid #4CAF50;
    `;
    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px; padding: 5px;">
            <i class="fas fa-bell" style="font-size: 24px; color: #4CAF50; margin-top: 5px;"></i>
            <div style="flex: 1;">
                ${content}
                <small style="color: #999; font-size: 11px; display: block; margin-top: 8px;">
                    <i class="fas fa-info-circle"></i> Klik untuk menutup
                </small>
            </div>
            <i class="fas fa-times" style="cursor: pointer; color: #999; padding: 5px;" onclick="this.parentElement.parentElement.remove()"></i>
        </div>
    `;
    
    toast.onclick = () => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    };
    
    document.body.appendChild(toast);
    
    // Auto remove after 6 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 6000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
