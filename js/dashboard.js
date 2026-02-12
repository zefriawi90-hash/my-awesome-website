// Dashboard Module for Storage App
let userFiles = [];

function showDashboard(user) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show dashboard section
    document.getElementById('dashboard-section').classList.add('active');
    
    // Update navigation
    updateNavigation(true, user);
    
    // Show welcome message for new login
    showWelcomeMessage(user);
    
    // Load user files/data
    loadUserFiles();
}

async function loadUserFiles() {
    try {
        const response = await authFetch('/api/data');
        const data = await response.json();
        
        userFiles = data.data || [];
        renderFilesList(userFiles);
        updateFileStats();
    } catch (err) {
        console.error('Error loading files:', err);
        // Show empty state if API fails
        renderFilesList([]);
        showToast('Gagal memuat data', 'error');
    }
}

function renderFilesList(files) {
    const container = document.getElementById('files-list');
    
    if (!container) return;
    
    if (files.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Belum ada data</h3>
                <p>Klik tombol "Tambah Data" untuk menambahkan data pertama Anda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Judul</th>
                    <th>Kategori</th>
                    <th>Konten</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${files.map(file => `
                    <tr>
                        <td>
                            <i class="fas ${getCategoryIcon(file.category)}"></i>
                            <strong>${escapeHtml(file.title)}</strong>
                        </td>
                        <td><span class="role-badge role-user">${escapeHtml(file.category)}</span></td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${escapeHtml(file.content || '-')}
                        </td>
                        <td>${formatDate(file.created_at)}</td>
                        <td>
                            <button class="btn-icon" onclick="editFile(${file.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="deleteFile(${file.id})" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getCategoryIcon(category) {
    const icons = {
        'work': 'fa-briefcase',
        'personal': 'fa-user',
        'finance': 'fa-wallet',
        'health': 'fa-heart',
        'education': 'fa-graduation-cap',
        'general': 'fa-folder'
    };
    return icons[category.toLowerCase()] || 'fa-folder';
}

function updateFileStats() {
    document.getElementById('total-files').textContent = userFiles.length;
    
    // Mock storage size (since we don't track actual file sizes in this version)
    document.getElementById('storage-used').textContent = (userFiles.length * 0.5).toFixed(1) + ' KB';
    
    // Shared files count (mock)
    document.getElementById('shared-files').textContent = '0';
    
    if (userFiles.length > 0) {
        const lastFile = userFiles[userFiles.length - 1];
        document.getElementById('last-activity').textContent = formatDate(lastFile.created_at);
    }
}

function showUploadModal() {
    // For this version, we use add data modal
    const modal = document.getElementById('data-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Create add data modal
        const newModal = document.createElement('div');
        newModal.id = 'data-modal';
        newModal.className = 'modal';
        newModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Tambah Data</h3>
                    <button class="modal-close" onclick="closeUploadModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="data-form" onsubmit="handleDataSubmit(event)">
                        <div class="form-group">
                            <label><i class="fas fa-heading"></i> Judul</label>
                            <input type="text" id="data-title" placeholder="Masukkan judul" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-tag"></i> Kategori</label>
                            <select id="data-category">
                                <option value="general">Umum</option>
                                <option value="work">Pekerjaan</option>
                                <option value="personal">Pribadi</option>
                                <option value="finance">Keuangan</option>
                                <option value="health">Kesehatan</option>
                                <option value="education">Pendidikan</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-align-left"></i> Konten</label>
                            <textarea id="data-content" rows="5" placeholder="Masukkan konten"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            <i class="fas fa-save"></i> Simpan
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(newModal);
        newModal.style.display = 'flex';
    }
}

function closeUploadModal() {
    const modal = document.getElementById('data-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleDataSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('data-title').value;
    const category = document.getElementById('data-category').value;
    const content = document.getElementById('data-content').value;
    
    showLoading();
    
    try {
        const response = await authFetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category, content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeUploadModal();
            loadUserFiles();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Gagal menyimpan data', 'error');
        console.error('Submit error:', err);
    }
    
    hideLoading();
}

function editFile(id) {
    const file = userFiles.find(f => f.id === id);
    if (!file) return;
    
    // Open modal for editing
    const modal = document.getElementById('data-modal');
    if (!modal) {
        showUploadModal();
    }
    
    // Wait for modal to be created
    setTimeout(() => {
        const dataModal = document.getElementById('data-modal');
        if (dataModal) {
            dataModal.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Edit Data';
            document.getElementById('data-title').value = file.title;
            document.getElementById('data-category').value = file.category;
            document.getElementById('data-content').value = file.content || '';
            
            // Change form submission to update
            const form = document.getElementById('data-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                await updateData(id);
            };
            
            // Add cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.style.width = '100%';
            cancelBtn.style.marginTop = '10px';
            cancelBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
            cancelBtn.onclick = () => {
                dataModal.style.display = 'none';
                // Reset form for next use
                form.reset();
                form.onsubmit = handleDataSubmit;
                dataModal.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-plus-circle"></i> Tambah Data';
            };
            form.appendChild(cancelBtn);
            
            dataModal.style.display = 'flex';
        }
    }, 100);
}

async function updateData(id) {
    const title = document.getElementById('data-title').value;
    const category = document.getElementById('data-category').value;
    const content = document.getElementById('data-content').value;
    
    showLoading();
    
    try {
        const response = await authFetch(`/api/data/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category, content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('data-modal').style.display = 'none';
            loadUserFiles();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Gagal mengupdate data', 'error');
    }
    
    hideLoading();
}

async function deleteFile(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    showLoading();
    
    try {
        const response = await authFetch(`/api/data/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadUserFiles();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Gagal menghapus data', 'error');
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
    const modal = document.getElementById('data-modal');
    if (e.target === modal) {
        closeUploadModal();
    }
});
