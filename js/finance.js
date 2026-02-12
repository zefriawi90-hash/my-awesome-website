// Finance Module for Daily Expenses and Income Tracking
let financeTransactions = [];
let currentEditingId = null;
let expenseChart = null;
let trendChart = null;

// Category definitions
const expenseCategories = {
    'makanan': { icon: 'fa-utensils', label: 'Makanan & Minuman' },
    'transportasi': { icon: 'fa-car', label: 'Transportasi' },
    'belanja': { icon: 'fa-shopping-cart', label: 'Belanja' },
    'hiburan': { icon: 'fa-film', label: 'Hiburan' },
    'tagihan': { icon: 'fa-file-invoice', label: 'Tagihan & Utilitas' },
    'kesehatan': { icon: 'fa-heartbeat', label: 'Kesehatan' },
    'pendidikan': { icon: 'fa-graduation-cap', label: 'Pendidikan' },
    'lainnya': { icon: 'fa-ellipsis-h', label: 'Lainnya' }
};

const incomeCategories = {
    'gaji': { icon: 'fa-money-bill-wave', label: 'Gaji/Penghasilan' },
    'bonus': { icon: 'fa-gift', label: 'Bonus' },
    'investasi': { icon: 'fa-chart-line', label: 'Investasi' },
    'hadiah': { icon: 'fa-gift', label: 'Hadiah' },
    'freelance': { icon: 'fa-laptop', label: 'Freelance' },
    'lainnya': { icon: 'fa-ellipsis-h', label: 'Lainnya' }
};

function showFinanceSection() {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show finance section
    document.getElementById('finance-section').classList.add('active');
    
    // Set today's date as default
    document.getElementById('finance-date').value = new Date().toISOString().split('T')[0];
    
    // Set current month in filter
    const monthSelect = document.getElementById('month-filter');
    if (monthSelect) {
        monthSelect.value = new Date().getMonth();
    }
    
    // Initialize charts
    setTimeout(() => {
        initCharts();
        loadChartData();
    }, 100);
    
    // Load finance data
    loadFinance();
}

function updateFinanceNavigation(isLoggedIn, user) {
    if (!isLoggedIn) return;
    
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        // Check if finance nav already exists
        if (!navMenu.querySelector('.finance-nav-item')) {
            const financeNav = document.createElement('li');
            financeNav.className = 'finance-nav-item';
            financeNav.innerHTML = `<a href="#" onclick="showFinanceSection(); return false;"><i class="fas fa-wallet"></i> Keuangan</a>`;
            navMenu.appendChild(financeNav);
        }
    }
}

async function loadFinance() {
    const date = document.getElementById('finance-date').value || new Date().toISOString().split('T')[0];
    
    try {
        const response = await authFetch(`/api/finance?date=${date}`);
        const data = await response.json();
        
        if (data.success) {
            financeTransactions = data.transactions || [];
            renderFinanceList(financeTransactions);
            updateFinanceSummary(data.summary);
        }
    } catch (err) {
        console.error('Error loading finance:', err);
        showToast('Gagal memuat data keuangan', 'error');
    }
}

function updateFinanceSummary(summary) {
    // Today values
    document.getElementById('today-income').textContent = formatCurrency(summary.todayIncome || 0);
    document.getElementById('today-expense').textContent = formatCurrency(summary.todayExpense || 0);
    
    const balanceCard = document.getElementById('balance-card');
    const todayBalance = summary.todayBalance || 0;
    document.getElementById('today-balance').textContent = formatCurrency(todayBalance);
    
    // Color coding for balance
    if (todayBalance >= 0) {
        balanceCard.querySelector('.value').style.color = '#10b981';
    } else {
        balanceCard.querySelector('.value').style.color = '#ef4444';
    }
    
    // Total balance
    const totalBalance = (summary.totalIncome || 0) - (summary.totalExpense || 0);
    document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
}

// Chart Functions
function initCharts() {
    initExpenseChart();
    initTrendChart();
}

function initExpenseChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#ff6b6b',
                    '#4ecdc4',
                    '#45b7d1',
                    '#96ceb4',
                    '#ffeaa7',
                    '#dfe6e9',
                    '#a29bfe',
                    '#fd79a8'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'white',
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                }
            }
        }
    });
}

function initTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Pemasukan',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Pengeluaran',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255,255,255,0.7)' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    ticks: { 
                        color: 'rgba(255,255,255,0.7)',
                        callback: function(value) {
                            return 'Rp ' + (value / 1000) + 'k';
                        }
                    },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

async function loadChartData() {
    try {
        const response = await authFetch('/api/finance/charts');
        const data = await response.json();
        
        if (data.success) {
            updateExpenseChart(data.expenseByCategory);
            updateTrendChart(data.weeklyTrend);
            loadMonthlySummary();
        }
    } catch (err) {
        console.error('Error loading chart data:', err);
        // Initialize empty charts
        initCharts();
    }
}

function updateExpenseChart(expenseByCategory) {
    if (!expenseChart) return;
    
    const labels = Object.keys(expenseByCategory).map(key => {
        return expenseCategories[key]?.label || key;
    });
    
    const values = Object.values(expenseByCategory);
    
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = values;
    expenseChart.update();
}

function updateTrendChart(weeklyTrend) {
    if (!trendChart) return;
    
    const labels = weeklyTrend.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    });
    
    const incomeData = weeklyTrend.map(item => item.income);
    const expenseData = weeklyTrend.map(item => item.expense);
    
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = incomeData;
    trendChart.data.datasets[1].data = expenseData;
    trendChart.update();
}

async function loadMonthlySummary() {
    const monthSelect = document.getElementById('month-filter');
    const month = monthSelect ? monthSelect.value : new Date().getMonth();
    const year = new Date().getFullYear();
    
    try {
        const response = await authFetch(`/api/finance/monthly?month=${month}&year=${year}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('month-income').textContent = formatCurrency(data.income || 0);
            document.getElementById('month-expense').textContent = formatCurrency(data.expense || 0);
            
            const balance = (data.income || 0) - (data.expense || 0);
            document.getElementById('month-balance').textContent = formatCurrency(balance);
            
            const balanceCard = document.getElementById('month-balance-card');
            if (balance >= 0) {
                balanceCard.querySelector('.value').style.color = '#10b981';
            } else {
                balanceCard.querySelector('.value').style.color = '#ef4444';
            }
        }
    } catch (err) {
        console.error('Error loading monthly summary:', err);
    }
}

function renderFinanceList(transactions) {
    const container = document.getElementById('finance-list');
    
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class=\"empty-state\">
                <i class=\"fas fa-receipt\"></i>
                <h3>Belum ada transaksi</h3>
                <p>Klik tombol \"Tambah Transaksi\" untuk mencatat keuangan Anda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class=\"data-table finance-table\">
            <thead>
                <tr>
                    <th>Kategori</th>
                    <th>Keterangan</th>
                    <th>Jumlah</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(t => renderTransactionRow(t)).join('')}
            </tbody>
        </table>
    `;
}

function renderTransactionRow(transaction) {
    const isExpense = transaction.type === 'expense';
    const category = isExpense ? expenseCategories[transaction.category] : incomeCategories[transaction.category];
    const categoryInfo = category || { icon: 'fa-tag', label: transaction.category };
    const amountClass = isExpense ? 'expense-amount' : 'income-amount';
    const amountPrefix = isExpense ? '-' : '+';
    
    return `
        <tr>
            <td>
                <i class=\"fas ${categoryInfo.icon}\"></i>
                <span>${escapeHtml(categoryInfo.label)}</span>
            </td>
            <td style=\"max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\">
                ${escapeHtml(transaction.description || '-')}
            </td>
            <td class=\"${amountClass}\">
                ${amountPrefix}${formatCurrency(transaction.amount)}
            </td>
            <td>
                <button class=\"btn-icon\" onclick=\"editTransaction(${transaction.id})\" title=\"Edit\">
                    <i class=\"fas fa-edit\"></i>
                </button>
                <button class=\"btn-icon btn-delete\" onclick=\"deleteTransaction(${transaction.id})\" title=\"Hapus\">
                    <i class=\"fas fa-trash\"></i>
                </button>
            </td>
        </tr>
    `;
}

function showTransactionModal(transaction = null) {
    currentEditingId = transaction ? transaction.id : null;
    
    const modal = document.getElementById('finance-modal');
    const title = document.getElementById('finance-modal-title');
    const form = document.getElementById('finance-form');
    
    // Set default date to today
    document.getElementById('finance-date').value = new Date().toISOString().split('T')[0];
    
    // Update categories based on type
    selectFinanceType(transaction ? transaction.type : 'expense');
    
    if (transaction) {
        title.innerHTML = '<i class=\"fas fa-edit\"></i> Edit Transaksi';
        document.getElementById('finance-type').value = transaction.type;
        document.getElementById('finance-amount').value = transaction.amount;
        document.getElementById('finance-description').value = transaction.description || '';
        document.getElementById('finance-date').value = transaction.transaction_date;
        
        // Set category dropdown
        const categorySelect = document.getElementById('finance-category');
        categorySelect.value = transaction.category;
        
        // Update type buttons
        updateTypeButtons(transaction.type);
        
        form.onsubmit = (e) => handleFinanceUpdate(e, transaction.id);
    } else {
        title.innerHTML = '<i class=\"fas fa-plus-circle\"></i> Tambah Transaksi';
        form.reset();
        form.onsubmit = handleFinanceSubmit;
    }
    
    modal.style.display = 'flex';
}

function closeFinanceModal() {
    const modal = document.getElementById('finance-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingId = null;
}

function selectFinanceType(type) {
    document.getElementById('finance-type').value = type;
    updateTypeButtons(type);
    updateCategoryOptions(type);
}

function updateTypeButtons(activeType) {
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === activeType) {
            btn.classList.add('active');
        }
    });
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('finance-category');
    const categories = type === 'expense' ? expenseCategories : incomeCategories;
    
    categorySelect.innerHTML = '<option value=\"\">Pilih Kategori</option>';
    
    Object.keys(categories).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = categories[key].label;
        categorySelect.appendChild(option);
    });
}

async function handleFinanceSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('finance-type').value;
    const category = document.getElementById('finance-category').value;
    const amount = parseFloat(document.getElementById('finance-amount').value);
    const description = document.getElementById('finance-description').value;
    const transaction_date = document.getElementById('finance-date').value;
    
    if (!category) {
        showToast('Silakan pilih kategori!', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await authFetch('/api/finance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, category, amount, description, transaction_date })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeFinanceModal();
            loadFinance();
            loadChartData();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Gagal menyimpan transaksi', 'error');
        console.error('Finance submit error:', err);
    }
    
    hideLoading();
}

async function handleFinanceUpdate(e, id) {
    e.preventDefault();
    
    const type = document.getElementById('finance-type').value;
    const category = document.getElementById('finance-category').value;
    const amount = parseFloat(document.getElementById('finance-amount').value);
    const description = document.getElementById('finance-description').value;
    const transaction_date = document.getElementById('finance-date').value;
    
    showLoading();
    
    try {
        const response = await authFetch(`/api/finance/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, category, amount, description, transaction_date })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeFinanceModal();
            loadFinance();
            loadChartData();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Gagal mengupdate transaksi', 'error');
    }
    
    hideLoading();
}

function editTransaction(id) {
    const transaction = financeTransactions.find(t => t.id === id);
    if (!transaction) return;
    showTransactionModal(transaction);
}

async function deleteTransaction(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    
    showLoading();
    
    try {
        const response = await authFetch(`/api/finance/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadFinance();
            loadChartData();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Gagal menghapus transaksi', 'error');
    }
    
    hideLoading();
}

// Utility functions
function formatCurrency(amount) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('finance-modal');
    if (e.target === modal) {
        closeFinanceModal();
    }
    
    const bgModal = document.getElementById('bg-settings-modal');
    if (e.target === bgModal) {
        closeBgSettingsModal();
    }
});

// Initialize categories on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set default categories
    updateCategoryOptions('expense');
    
    // Add quick date buttons
    const dateFilter = document.querySelector('.finance-date-filter');
    if (dateFilter) {
        const quickButtons = document.createElement('div');
        quickButtons.className = 'quick-date-buttons';
        quickButtons.style.cssText = 'display: flex; gap: 8px;';
        quickButtons.innerHTML = `
            <button type=\"button\" class=\"btn btn-secondary\" onclick=\"setQuickDate('today')\">Hari Ini</button>
            <button type=\"button\" class=\"btn btn-secondary\" onclick=\"setQuickDate('yesterday')\">Kemarin</button>
        `;
        dateFilter.appendChild(quickButtons);
    }
});

function setQuickDate(type) {
    const dateInput = document.getElementById('finance-date');
    const today = new Date();
    
    if (type === 'today') {
        dateInput.value = today.toISOString().split('T')[0];
    } else if (type === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateInput.value = yesterday.toISOString().split('T')[0];
    }
    
    loadFinance();
}
