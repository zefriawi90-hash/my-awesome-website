// Admin Module for Storage App
function showAdminPanel() {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show admin section
    document.getElementById('admin-section').classList.add('active');
    
    // Load admin data
    loadAdminStats();
    loadUsers();
    updateNavigation(true, { role: 'admin' });
}

async function loadAdminStats() {
    try {
        const response = await authFetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.stats) {
            document.getElementById('total-users').textContent = data.stats.totalUsers || 0;
            // Total storage - approximate based on data count
            document.getElementById('total-storage').textContent = (data.stats.totalData || 0) + ' items';
            document.getElementById('admin-total-files').textContent = data.stats.totalData || 0;
        }
    } catch (err) {
        console.error('Error loading admin stats:', err);
    }
}

async function loadUsers() {
    try {
        const response = await authFetch('/api/admin/users');
        const data = await response.json();
        
        if (data.users) {
            renderUsersTable(data.users);
        }
    } catch (err) {
        console.error('Error loading users:', err);
        document.getElementById('users-list').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Gagal memuat data</h3>
                <p>Terjadi kesalahan saat memuat data users</p>
            </div>
        `;
    }
}

function renderUsersTable(users) {
    const container = document.getElementById('users-list');
    
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Belum ada user</h3>
                <p>User akan muncul di sini setelah ada yang mendaftar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Tanggal Daftar</th>
                    <th>Login Terakhir</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody id="users-table-body">
                ${users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td><strong>${escapeHtml(user.username)}</strong></td>
                        <td>${escapeHtml(user.email)}</td>
                        <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                        <td>${formatDate(user.created_at)}</td>
                        <td>${user.last_login ? formatDate(user.last_login) : '-'}</td>
                        <td>
                            <button class="btn-icon" onclick="viewUserData(${user.id})" title="Lihat Data">
                                <i class="fas fa-folder-open"></i>
                            </button>
                            ${user.role !== 'admin' ? `
                            <button class="btn-icon btn-delete" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')" title="Hapus User">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function viewUserData(userId) {
    showLoading();
    
    try {
        const response = await authFetch(`/api/admin/user/${userId}/data`);
        const data = await response.json();
        
        if (data.user && data.data) {
            showUserDataModal(data.user, data.data);
        } else {
            showUserDataModal(data.user || { id: userId, username: 'Unknown' }, []);
        }
    } catch (err) {
        showToast('Gagal memuat data user', 'error');
        console.error('Error viewing user data:', err);
    }
    
    hideLoading();
}

function showUserDataModal(user, dataList) {
    // Create modal if doesn't exist
    let modal = document.getElementById('user-data-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-data-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><i class="fas fa-user"></i> Data User: <span id="modal-username"></span></h3>
                    <button class="modal-close" onclick="closeUserDataModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="user-data-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modal-username').textContent = user.username;
    
    const dataContainer = document.getElementById('user-data-list');
    if (dataList.length === 0) {
        dataContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>User ini belum memiliki data</p>
            </div>
        `;
    } else {
        dataContainer.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Judul</th>
                        <th>Kategori</th>
                        <th>Konten</th>
                        <th>Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataList.map(item => `
                        <tr>
                            <td><strong>${escapeHtml(item.title)}</strong></td>
                            <td><span class="role-badge role-user">${escapeHtml(item.category)}</span></td>
                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${escapeHtml(item.content || '-')}
                            </td>
                            <td>${formatDate(item.created_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    modal.style.display = 'flex';
}

function closeUserDataModal() {
    const modal = document.getElementById('user-data-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${username}"? Semua datanya juga akan dihapus.`)) return;
    
    showLoading();
    
    try {
        const response = await authFetch(`/api/admin/user/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadAdminStats();
            loadUsers();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Gagal menghapus user', 'error');
        console.error('Delete user error:', err);
    }
    
    hideLoading();
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('user-data-modal');
    if (e.target === modal) {
        closeUserDataModal();
    }
});
