// Football Matches Management (Admin Only)

// Check if user is admin
function isAdmin() {
  return window.userRole === 'admin';
}

// Initialize football page
async function initFootballPage() {
  if (!isAdmin()) {
    document.getElementById('adminSection').style.display = 'none';
  }
  
  await loadMatches();
  await loadLeagues();
}

// Load all matches
async function loadMatches(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await authFetch(`/api/football/matches?${params}`);
    const data = await response.json();
    
    if (data.success) {
      displayMatches(data.matches);
    } else {
      showNotification(data.error || 'Gagal memuat data', 'error');
    }
  } catch (error) {
    console.error('Error loading matches:', error);
    showNotification('Terjadi kesalahan saat memuat data', 'error');
  }
}

// Load leagues for filter
async function loadLeagues() {
  try {
    const response = await authFetch('/api/football/matches');
    const data = await response.json();
    
    if (data.success && data.leagues) {
      const select = document.getElementById('leagueFilter');
      select.innerHTML = '<option value="">Semua Liga</option>';
      data.leagues.forEach(league => {
        select.innerHTML += `<option value="${league}">${league}</option>`;
      });
    }
  } catch (error) {
    console.error('Error loading leagues:', error);
  }
}

// Display matches in table
function displayMatches(matches) {
  const tbody = document.getElementById('matchesTableBody');
  const table = document.getElementById('matchesTable');
  const empty = document.getElementById('emptyMatches');
  
  if (!matches || matches.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  
  table.style.display = 'table';
  empty.style.display = 'none';
  
  tbody.innerHTML = matches.map(match => `
    <tr>
      <td>${match.match_date || '-'}</td>
      <td>${match.match_time || '-'}</td>
      <td>${match.league_name}</td>
      <td>
        <span class="team home">${getTeamBadge(match.home_team, true)}${match.home_team}</span>
        <span class="vs">VS</span>
        <span class="team away">${match.away_team}${getTeamBadge(match.away_team, false)}</span>
      </td>
      <td class="score">
        ${(match.status === 'finished' || match.status === 'live') && match.home_score !== null && match.away_score !== null
          ? `<strong>${match.home_score} - ${match.away_score}</strong>`
          : '<span class="pending">-</span>'
        }
      </td>
      <td>
        <span class="status ${match.status}">${getStatusLabel(match.status)}</span>
      </td>
      ${isAdmin() ? `
      <td class="actions">
        <button class="btn btn-sm btn-edit" onclick="editMatch(${match.id})" title="Edit">
          <i class="icon">✏️</i>
        </button>
        <button class="btn btn-sm btn-delete" onclick="deleteMatch(${match.id})" title="Hapus">
          <i class="icon">🗑️</i>
        </button>
      </td>
      ` : ''}
    </tr>
  `).join('');
}

// Get team initial for badge
function getTeamInitial(teamName) {
  if (!teamName) return '?';
  const words = teamName.split(' ');
  if (words.length === 1) return teamName.substring(0, 2).toUpperCase();
  return words.map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

// Get club image URL
function getClubImageUrl(teamName) {
  if (!teamName) return null;
  
  console.log('getClubImageUrl called with:', teamName);
  
  // Map team names to image files
  const teamImageMap = {
    // English Premier League
    'manchester city': 'manchester-city.svg',
    'manchester united': 'manchester-united.svg',
    'manchester city fc': 'manchester-city.svg',
    'manchester united fc': 'manchester-united.svg',
    'manchester': 'manchester-city.svg',
    'city': 'manchester-city.svg',
    'united': 'manchester-united.svg',
    'liverpool': 'liverpool.svg',
    'chelsea': 'chelsea.svg',
    'arsenal': 'arsenal.svg',
    'tottenham': 'manchester-united.svg',
    'newcastle': 'manchester-united.svg',
    'brighton': 'manchester-united.svg',
    'west ham': 'manchester-united.svg',
    'aston villa': 'manchester-united.svg',
    
    // Spanish La Liga
    'barcelona': 'barcelona.svg',
    'fc barcelona': 'barcelona.svg',
    'fc barca': 'barcelona.svg',
    'barca': 'barcelona.svg',
    'real madrid': 'real-madrid.svg',
    'real': 'real-madrid.svg',
    'atletico madrid': 'manchester-city.svg',
    'atletico': 'manchester-city.svg',
    'sevilla': 'manchester-city.svg',
    
    // Italian Serie A
    'juventus': 'manchester-city.svg',
    'juve': 'manchester-city.svg',
    'inter milan': 'manchester-city.svg',
    'ac milan': 'manchester-city.svg',
    'milan': 'manchester-city.svg',
    'inter': 'manchester-city.svg',
    'inter milano': 'manchester-city.svg',
    'ac milano': 'manchester-city.svg',
    'napoli': 'manchester-city.svg',
    'roma': 'manchester-city.svg',
    
    // German Bundesliga
    'bayern': 'manchester-city.svg',
    'bayern munich': 'manchester-city.svg',
    'bayern munchen': 'manchester-city.svg',
    'borussia dortmund': 'manchester-city.svg',
    'dortmund': 'manchester-city.svg',
    'bvb': 'manchester-city.svg',
    'leverkusen': 'manchester-city.svg',
    
    // French Ligue 1
    'psg': 'manchester-city.svg',
    'paris saint germain': 'manchester-city.svg',
    'psg paris': 'manchester-city.svg',
    'marseille': 'manchester-city.svg',
    'lyon': 'manchester-city.svg',
    'monaco': 'manchester-city.svg',
    
    // Indonesian Liga
    'persib': 'persib.svg',
    'persija': 'persija.svg',
    'arema': 'manchester-city.svg',
    'psis': 'manchester-united.svg',
    'persebaya': 'manchester-city.svg',
    'borneo': 'manchester-united.svg',
    'bali united': 'manchester-city.svg',
    'madura united': 'manchester-united.svg',
    'psm makassar': 'manchester-city.svg',
    
    // Other popular clubs
    'al hilal': 'manchester-city.svg',
    'al ittihad': 'manchester-united.svg',
    'al nassr': 'manchester-city.svg',
    
    // Additional variations
    'man utd': 'manchester-united.svg',
    'man city': 'manchester-city.svg',
    'mu': 'manchester-united.svg',
    'mci': 'manchester-city.svg',
    'liv': 'liverpool.svg',
    'che': 'chelsea.svg',
    'ars': 'arsenal.svg',
    'tot': 'manchester-united.svg',
    'new': 'manchester-united.svg',
    'avl': 'manchester-united.svg',
    'bha': 'manchester-united.svg',
    'whu': 'manchester-united.svg',
    'atm': 'manchester-city.svg',
    'rma': 'real-madrid.svg',
    'fcb': 'barcelona.svg',
  };
  
  // Convert team name to lowercase and check map
  const normalizedName = teamName.toLowerCase().trim();
  console.log('Normalized name:', normalizedName);
  
  // First, try exact match
  if (teamImageMap[normalizedName]) {
    console.log('Exact match found:', normalizedName, '->', teamImageMap[normalizedName]);
    return `/images/clubs/${teamImageMap[normalizedName]}`;
  }
  
  // Then try partial match (includes)
  for (const [key, value] of Object.entries(teamImageMap)) {
    if (normalizedName.includes(key) && key.length > 2) {
      console.log('Partial match found:', key, '->', value);
      return `/images/clubs/${value}`;
    }
  }
  
  console.log('No match found for:', normalizedName);
  return null;
}

// Get team badge (image or initial)
function getTeamBadge(teamName, isHome = true) {
  const imageUrl = getClubImageUrl(teamName);
  console.log('Team:', teamName, 'Image URL:', imageUrl);
  
  if (imageUrl) {
    return `<img src="${imageUrl}" alt="${teamName}" class="team-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';"><span class="team-initial" style="display:none;">${getTeamInitial(teamName)}</span>`;
  }
  return `<span class="team-initial">${getTeamInitial(teamName)}</span>`;
}

// Get status label
function getStatusLabel(status) {
  const labels = {
    'scheduled': 'Jadwal',
    'live': 'Sedang Berlangsung',
    'finished': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return labels[status] || status;
}

// Show add match modal
function showAddModal() {
  document.getElementById('matchModalTitle').textContent = 'Tambah Pertandingan';
  document.getElementById('matchForm').reset();
  document.getElementById('matchId').value = '';
  document.getElementById('matchModal').style.display = 'flex';
}

// Hide match modal
function hideMatchModal() {
  document.getElementById('matchModal').style.display = 'none';
}

// Edit match
async function editMatch(id) {
  try {
    const response = await authFetch(`/api/football/matches/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const match = data.match;
      document.getElementById('matchModalTitle').textContent = 'Update Skor';
      document.getElementById('matchId').value = match.id;
      document.getElementById('leagueName').value = match.league_name;
      document.getElementById('homeTeam').value = match.home_team;
      document.getElementById('awayTeam').value = match.away_team;
      document.getElementById('matchDate').value = match.match_date;
      document.getElementById('matchTime').value = match.match_time;
      document.getElementById('homeScore').value = match.home_score || 0;
      document.getElementById('awayScore').value = match.away_score || 0;
      document.getElementById('matchStatus').value = match.status;
      
      // Disable non-score fields when editing
      document.getElementById('leagueName').readOnly = true;
      document.getElementById('homeTeam').readOnly = true;
      document.getElementById('awayTeam').readOnly = true;
      document.getElementById('matchDate').readOnly = true;
      document.getElementById('matchTime').readOnly = true;
      
      document.getElementById('matchModal').style.display = 'flex';
    }
  } catch (error) {
    showNotification('Gagal memuat data', 'error');
  }
}

// Submit match form
async function submitMatchForm(event) {
  event.preventDefault();
  
  const id = document.getElementById('matchId').value;
  const isEdit = !!id;
  
  const formData = {
    league_name: document.getElementById('leagueName').value,
    home_team: document.getElementById('homeTeam').value,
    away_team: document.getElementById('awayTeam').value,
    match_date: document.getElementById('matchDate').value,
    match_time: document.getElementById('matchTime').value
  };
  
  if (!isEdit) {
    // Add mode - all fields required
    if (!formData.league_name || !formData.home_team || !formData.away_team || !formData.match_date) {
      showNotification('Semua field wajib diisi', 'error');
      return;
    }
  } else {
    // Edit mode - only score and status
    formData.home_score = parseInt(document.getElementById('homeScore').value) || 0;
    formData.away_score = parseInt(document.getElementById('awayScore').value) || 0;
    formData.status = document.getElementById('matchStatus').value;
  }
  
  try {
    const url = isEdit ? `/api/football/matches/${id}` : '/api/football/matches';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(data.message, 'success');
      hideMatchModal();
      await loadMatches();
      await loadLeagues();
    } else {
      showNotification(data.error || 'Gagal menyimpan', 'error');
    }
  } catch (error) {
    showNotification('Terjadi kesalahan', 'error');
  }
}

// Delete match
async function deleteMatch(id) {
  if (!confirm('Yakin ingin menghapus pertandingan ini?')) return;
  
  try {
    const response = await authFetch(`/api/football/matches/${id}`, { method: 'DELETE' });
    const data = await response.json();
    
    if (data.success) {
      showNotification(data.message, 'success');
      await loadMatches();
      await loadLeagues();
    } else {
      showNotification(data.error || 'Gagal menghapus', 'error');
    }
  } catch (error) {
    showNotification('Terjadi kesalahan', 'error');
  }
}

// Filter matches
function filterMatches() {
  const filters = {};
  
  const league = document.getElementById('leagueFilter').value;
  const status = document.getElementById('statusFilter').value;
  const date = document.getElementById('dateFilter').value;
  
  if (league) filters.league = league;
  if (status) filters.status = status;
  if (date) filters.date = date;
  
  loadMatches(filters);
}

// Reset filters
function resetFilters() {
  document.getElementById('leagueFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('dateFilter').value = '';
  loadMatches();
}

// Show notification (uses existing showToast from main.js)
function showNotification(message, type = 'info') {
  showToast(message, type);
}

// Reset form when modal is closed
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('matchModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideMatchModal();
      }
    });
  }
  
  // Reset readonly fields when showing add modal
  const addBtn = document.getElementById('addMatchBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      document.getElementById('leagueName').readOnly = false;
      document.getElementById('homeTeam').readOnly = false;
      document.getElementById('awayTeam').readOnly = false;
      document.getElementById('matchDate').readOnly = false;
      document.getElementById('matchTime').readOnly = false;
    });
  }
});

// Show add match modal
function showAddMatchModal() {
  const modal = document.getElementById('matchModal');
  if (!modal) {
    // Create modal if it doesn't exist
    createMatchModal();
  }
  
  const form = document.getElementById('matchForm');
  if (form) form.reset();
  
  document.getElementById('matchModalTitle').textContent = 'Tambah Pertandingan';
  document.getElementById('leagueName').readOnly = false;
  document.getElementById('homeTeam').readOnly = false;
  document.getElementById('awayTeam').readOnly = false;
  document.getElementById('matchDate').readOnly = false;
  document.getElementById('matchTime').readOnly = false;
  
  const saveBtn = document.getElementById('saveMatchBtn');
  if (saveBtn) {
    saveBtn.onclick = () => saveMatch();
  }
  
  modal.style.display = 'flex';
}

// Create match modal HTML
function createMatchModal() {
  const modalHTML = `
    <div id="matchModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="matchModalTitle"><i class="fas fa-futbol"></i> Tambah Pertandingan</h3>
          <button class="modal-close" onclick="hideMatchModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="matchForm">
            <div class="form-group">
              <label><i class="fas fa-trophy"></i> Nama Liga</label>
              <input type="text" id="leagueName" required>
            </div>
            <div class="form-group">
              <label><i class="fas fa-home"></i> Tim Tuan Rumah</label>
              <input type="text" id="homeTeam" required>
            </div>
            <div class="form-group">
              <label><i class="fas fa-plane"></i> Tim Tamu</label>
              <input type="text" id="awayTeam" required>
            </div>
            <div class="form-group">
              <label><i class="fas fa-calendar"></i> Tanggal</label>
              <input type="date" id="matchDate" required>
            </div>
            <div class="form-group">
              <label><i class="fas fa-clock"></i> Waktu</label>
              <input type="time" id="matchTime" required>
            </div>
            <div class="form-group">
              <label><i class="fas fa-info-circle"></i> Status</label>
              <select id="matchStatus">
                <option value="scheduled">Dijadwalkan</option>
                <option value="live">Sedang Berlangsung</option>
                <option value="finished">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="hideMatchModal()">Batal</button>
              <button type="button" class="btn btn-primary" id="saveMatchBtn" onclick="saveMatch()">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Hide match modal
function hideMatchModal() {
  const modal = document.getElementById('matchModal');
  if (modal) modal.style.display = 'none';
}

// Save match
async function saveMatch() {
  const matchData = {
    league_name: document.getElementById('leagueName').value,
    home_team: document.getElementById('homeTeam').value,
    away_team: document.getElementById('awayTeam').value,
    match_date: document.getElementById('matchDate').value,
    match_time: document.getElementById('matchTime').value,
    status: document.getElementById('matchStatus').value
  };
  
  if (!matchData.league_name || !matchData.home_team || !matchData.away_team || !matchData.match_date) {
    showNotification('Mohon lengkapi semua data!', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/football/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Pert berhasil ditambahkan!', 'success');
      hideMatchModal();
      loadMatches();
    } else {
      showNotification(data.error || 'Gagal menambahkan pert', 'error');
    }
  } catch (error) {
    console.error('Error saving match:', error);
    showNotification('Terjadi kesalahan', 'error');
  }
}

// ==================== LEAGUE STANDINGS ====================

// Load standings for a league
async function loadStandings(leagueName) {
  try {
    const response = await authFetch(`/api/football/standings?league=${encodeURIComponent(leagueName)}`);
    const data = await response.json();
    
    if (data.success) {
      displayStandings(data.standings);
    } else {
      showNotification(data.error || 'Gagal memuat klasemen', 'error');
    }
  } catch (error) {
    console.error('Error loading standings:', error);
    showNotification('Terjadi kesalahan saat memuat klasemen', 'error');
  }
}

// Display standings in table
function displayStandings(standings) {
  const tableBody = document.getElementById('standingsTableBody');
  const table = document.getElementById('standingsTable');
  const empty = document.getElementById('emptyStandings');
  const container = document.getElementById('standingsContainer');
  
  if (!standings || standings.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  
  container.style.display = 'block';
  empty.style.display = 'none';
  
  tableBody.innerHTML = standings.map((team, index) => `
    <tr class="${index < 4 ? 'qualified' : ''} ${index >= standings.length - 3 ? 'relegated' : ''}">
      <td class="position">${index + 1}</td>
      <td class="team-cell">
        ${getTeamBadge(team.team_name, true)}
        <span class="team-name">${team.team_name}</span>
      </td>
      <td>${team.played}</td>
      <td>${team.won}</td>
      <td>${team.drawn}</td>
      <td>${team.lost}</td>
      <td class="goals-for">${team.goals_for}</td>
      <td class="goals-against">${team.goals_against}</td>
      <td class="goal-diff">${team.goal_diff > 0 ? '+' + team.goal_diff : team.goal_diff}</td>
      <td class="points ${team.points >= 60 ? 'high-points' : team.points >= 40 ? 'medium-points' : 'low-points'}">${team.points}</td>
    </tr>
  `).join('');
}

// Show standings section
function showStandingsSection() {
  const leagueSelect = document.getElementById('leagueStandingsSelect');
  if (leagueSelect && leagueSelect.value) {
    loadStandings(leagueSelect.value);
  }
}

// Filter standings by league
function filterStandings() {
  const leagueSelect = document.getElementById('leagueStandingsSelect');
  if (leagueSelect && leagueSelect.value) {
    loadStandings(leagueSelect.value);
  }
}
