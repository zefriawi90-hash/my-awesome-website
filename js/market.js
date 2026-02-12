// Market Analysis Module for Forex & Crypto
let cryptoData = [];
let forexData;
let selectedSymbol = null;
let cryptoChart = null;

// Crypto watchlist
const cryptoWatchlist = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple', 'polkadot', 'dogecoin', 'binancecoin'];

function showMarketSection() {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show market section
    const marketSection = document.getElementById('market-section');
    if (marketSection) {
        marketSection.classList.add('active');
    } else {
        createMarketSection();
        document.getElementById('market-section').classList.add('active');
    }
    
    // Load market data
    loadCryptoData();
    loadForexData();
    
    // Update navigation
    const navMenu = document.getElementById('nav-menu');
    if (navMenu && !navMenu.querySelector('.market-nav-item')) {
        const marketNav = document.createElement('li');
        marketNav.className = 'market-nav-item';
        marketNav.innerHTML = `<a href="#" onclick="showMarketSection(); return false;"><i class="fas fa-chart-line"></i> Market</a>`;
        navMenu.appendChild(marketNav);
    }
}

function createMarketSection() {
    const mainContent = document.querySelector('main') || document.body;
    
    const marketSection = document.createElement('section');
    marketSection.id = 'market-section';
    marketSection.className = 'section';
    
    marketSection.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-chart-line"></i> Market Analysis</h2>
            <p class="subtitle">Analisis Forex & Crypto dengan AI Assistant</p>
        </div>
        
        <!-- Disclaimer -->
        <div class="market-disclaimer">
            <i class="fas fa-exclamation-triangle"></i>
            <span>⚠️ <strong>Penting:</strong> Semua analisis bersifat EDUKATIF saja. Bukan saran investasi. Investasi di forex/kripto berisiko tinggi. Pasti untung TIDAK ADA yang menjamin.</span>
        </div>
        
        <!-- Tabs -->
        <div class="market-tabs">
            <button class="tab-btn active" onclick="switchMarketTab('crypto')">
                <i class="fab fa-bitcoin"></i> Crypto
            </button>
            <button class="tab-btn" onclick="switchMarketTab('forex')">
                <i class="fas fa-dollar-sign"></i> Forex
            </button>
            <button class="tab-btn" onclick="switchMarketTab('ai')">
                <i class="fas fa-robot"></i> AI Analysis
            </button>
        </div>
        
        <!-- Crypto Panel -->
        <div id="crypto-panel" class="market-panel active">
            <div class="market-stats">
                <div class="stat-card">
                    <i class="fas fa-coins" style="color: #f7931a;"></i>
                    <div class="stat-info">
                        <span class="stat-label">Total Market Cap</span>
                        <span class="stat-value" id="total-market-cap">Loading...</span>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-fire" style="color: #ff6b6b;"></i>
                    <div class="stat-info">
                        <span class="stat-label">24h Volume</span>
                        <span class="stat-value" id="total-volume">Loading...</span>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-arrow-up" style="color: #10b981;"></i>
                    <div class="stat-info">
                        <span class="stat-label">Top Gainer 24h</span>
                        <span class="stat-value" id="top-gainer">Loading...</span>
                    </div>
                </div>
            </div>
            
            <div class="crypto-grid" id="crypto-grid">
                <!-- Crypto cards will be loaded here -->
            </div>
        </div>
        
        <!-- Forex Panel -->
        <div id="forex-panel" class="market-panel">
            <div class="forex-table-container">
                <table class="data-table forex-table">
                    <thead>
                        <tr>
                            <th>Pair</th>
                            <th>Bid</th>
                            <th>Ask</th>
                            <th>Change 24h</th>
                            <th>High</th>
                            <th>Low</th>
                            <th>Trend</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="forex-table-body">
                        <!-- Forex data will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- AI Analysis Panel -->
        <div id="ai-panel" class="market-panel">
            <div class="ai-selector">
                <h3><i class="fas fa-robot"></i> AI Trading Assistant</h3>
                <select id="ai-symbol-select" onchange="loadAIAnalysis()">
                    <optgroup label="Crypto">
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="SOL">Solana (SOL)</option>
                        <option value="XRP">XRP</option>
                        <option value="ADA">Cardano (ADA)</option>
                    </optgroup>
                    <optgroup label="Forex">
                        <option value="USD/IDR">USD/IDR</option>
                        <option value="EUR/USD">EUR/USD</option>
                        <option value="GBP/USD">GBP/USD</option>
                        <option value="USD/JPY">USD/JPY</option>
                    </optgroup>
                </select>
                <button class="btn btn-primary" onclick="loadAIAnalysis()">
                    <i class="fas fa-sync-alt"></i> Analisis
                </button>
            </div>
            
            <div id="ai-results" class="ai-results">
                <div class="empty-state">
                    <i class="fas fa-robot"></i>
                    <h3>AI Analysis</h3>
                    <p>Pilih aset dan klik "Analisis" untuk melihat prediksi AI</p>
                </div>
            </div>
        </div>
    `;
    
    mainContent.appendChild(marketSection);
}

function switchMarketTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update panels
    document.querySelectorAll('.market-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`${tab}-panel`).classList.add('active');
}

// Load Crypto Data
async function loadCryptoData() {
    try {
        showLoading();
        const response = await authFetch('/api/market/crypto');
        const data = await response.json();
        
        if (data.success) {
            cryptoData = data.data;
            renderCryptoGrid();
            updateCryptoStats();
        }
    } catch (err) {
        console.error('Error loading crypto data:', err);
        showToast('Gagal memuat data crypto', 'error');
    }
    hideLoading();
}

function renderCryptoGrid() {
    const grid = document.getElementById('crypto-grid');
    if (!grid) return;
    
    grid.innerHTML = cryptoData.map(coin => `
        <div class="crypto-card" onclick="showCryptoDetail('${coin.id}')">
            <div class="crypto-header">
                <img src="${coin.image}" alt="${coin.name}" class="crypto-icon">
                <div class="crypto-info">
                    <h4>${coin.name}</h4>
                    <span class="crypto-symbol">${coin.symbol}</span>
                </div>
                <span class="price-change ${coin.price_change_24h >= 0 ? 'positive' : 'negative'}">
                    ${coin.price_change_24h >= 0 ? '+' : ''}${coin.price_change_24h?.toFixed(2) || 0}%
                </span>
            </div>
            <div class="crypto-price">
                <span class="current-price">$${formatNumber(coin.current_price)}</span>
            </div>
            <div class="crypto-details">
                <div class="detail-row">
                    <span>Market Cap</span>
                    <span>$${formatLargeNumber(coin.market_cap)}</span>
                </div>
                <div class="detail-row">
                    <span>Volume 24h</span>
                    <span>$${formatLargeNumber(coin.volume)}</span>
                </div>
                <div class="detail-row">
                    <span>7d Change</span>
                    <span class="${coin.price_change_7d >= 0 ? 'positive' : 'negative'}">
                        ${coin.price_change_7d >= 0 ? '+' : ''}${coin.price_change_7d?.toFixed(2) || 0}%
                    </span>
                </div>
            </div>
            <div class="crypto-actions">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); loadAIAnalysis('${coin.symbol}')">
                    <i class="fas fa-robot"></i> AI Analysis
                </button>
            </div>
        </div>
    `).join('');
}

function updateCryptoStats() {
    const totalCap = cryptoData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalVol = cryptoData.reduce((sum, coin) => sum + (coin.volume || 0), 0);
    const topGainer = cryptoData.reduce((max, coin) => 
        (coin.price_change_24h > (max?.price_change_24h || -999)) ? coin : max
    , null);
    
    document.getElementById('total-market-cap').textContent = formatLargeNumber(totalCap);
    document.getElementById('total-volume').textContent = formatLargeNumber(totalVol);
    
    if (topGainer) {
        document.getElementById('top-gainer').innerHTML = `
            <span style="color: #10b981;">${topGainer.symbol.toUpperCase()}</span>
            <small>+${topGainer.price_change_24h?.toFixed(2)}%</small>
        `;
    }
}

function showCryptoDetail(symbol) {
    selectedSymbol = symbol;
    const coin = cryptoData.find(c => c.id === symbol);
    if (!coin) return;
    
    // Switch to AI panel and load analysis
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-btn[onclick*="ai"]').classList.add('active');
    
    document.querySelectorAll('.market-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('ai-panel').classList.add('active');
    
    // Set selected symbol
    document.getElementById('ai-symbol-select').value = coin.symbol.toUpperCase();
    loadAIAnalysis(coin.symbol.toUpperCase());
}

// Load Forex Data
async function loadForexData() {
    try {
        const response = await authFetch('/api/market/forex');
        const data = await response.json();
        
        if (data.success) {
            forexData = data.data;
            renderForexTable();
        }
    } catch (err) {
        console.error('Error loading forex data:', err);
        showToast('Gagal memuat data forex', 'error');
    }
}

function renderForexTable() {
    const tbody = document.getElementById('forex-table-body');
    if (!tbody || !forexData) return;
    
    tbody.innerHTML = forexData.pairs.map(pair => `
        <tr>
            <td>
                <strong>${pair.pair}</strong>
                <br><small style="opacity: 0.7;">${pair.name}</small>
            </td>
            <td class="price">${formatForexPrice(pair.bid, pair.pair)}</td>
            <td class="price">${formatForexPrice(pair.ask, pair.pair)}</td>
            <td class="${pair.change_24h >= 0 ? 'positive' : 'negative'}">
                ${pair.change_24h >= 0 ? '+' : ''}${pair.change_24h?.toFixed(2)}%
            </td>
            <td>${formatForexPrice(pair.high, pair.pair)}</td>
            <td>${formatForexPrice(pair.low, pair.pair)}</td>
            <td>
                <span class="trend-badge ${pair.trend}">
                    <i class="fas fa-arrow-${pair.trend === 'up' ? 'up' : 'down'}"></i>
                    ${pair.trend.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="loadAIAnalysis('${pair.pair.replace('/', '')}')">
                    <i class="fas fa-robot"></i> AI
                </button>
            </td>
        </tr>
    `).join('');
}

// Load AI Analysis
async function loadAIAnalysis(symbol) {
    const select = document.getElementById('ai-symbol-select');
    const selectedSymbol = symbol || select.value;
    
    if (!selectedSymbol) {
        showToast('Pilih aset terlebih dahulu', 'warning');
        return;
    }
    
    try {
        const type = selectedSymbol.includes('/') ? 'forex' : 'crypto';
        showLoading();
        
        const response = await authFetch(`/api/market/ai/${selectedSymbol}?type=${type}`);
        const data = await response.json();
        
        if (data.success) {
            renderAIResults(data.ai);
        }
    } catch (err) {
        console.error('Error loading AI analysis:', err);
        showToast('Gagal memuat analisis AI', 'error');
    }
    hideLoading();
}

function renderAIResults(ai) {
    const container = document.getElementById('ai-results');
    if (!container) return;
    
    const actionClass = ai.recommendation.action === 'BUY' ? 'positive' : 
                        ai.recommendation.action === 'SELL' ? 'negative' : 'neutral';
    
    const sentimentClass = ai.sentiment_analysis.overall === 'POSITIVE' ? 'positive' : 'negative';
    const riskClass = ai.risk_assessment.level === 'LOW' ? 'positive' : 
                      ai.risk_assessment.level === 'HIGH' ? 'negative' : 'neutral';
    
    container.innerHTML = `
        <div class="ai-header">
            <h3><i class="fas fa-chart-bar"></i> ${ai.symbol} - AI Analysis</h3>
            <span class="timestamp">Diperbarui: ${formatDate(ai.generated_at)}</span>
        </div>
        
        <div class="ai-cards">
            <!-- Recommendation Card -->
            <div class="ai-card recommendation-card ${actionClass}">
                <div class="ai-card-header">
                    <i class="fas fa-lightbulb"></i>
                    <h4>Rekomendasi AI</h4>
                </div>
                <div class="ai-card-body">
                    <div class="recommendation-action ${actionClass}">
                        ${ai.recommendation.action}
                    </div>
                    <div class="confidence">
                        <span>Confidence:</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${ai.recommendation.confidence}%"></div>
                        </div>
                        <span>${ai.recommendation.confidence}%</span>
                    </div>
                    <p class="reason">${ai.recommendation.reason}</p>
                </div>
            </div>
            
            <!-- Prediction Card -->
            <div class="ai-card prediction-card">
                <div class="ai-card-header">
                    <i class="fas fa-crystal-ball"></i>
                    <h4>Prediksi</h4>
                </div>
                <div class="ai-card-body">
                    <div class="prediction-direction ${ai.prediction.direction.toLowerCase()}">
                        <i class="fas fa-arrow-${ai.prediction.direction === 'UP' ? 'up' : ai.prediction.direction === 'DOWN' ? 'down' : 'minus'}"></i>
                        <span>${ai.prediction.direction}</span>
                    </div>
                    <div class="prediction-details">
                        <p>Probabilitas: <strong>${ai.prediction.probability?.toFixed(1)}%</strong></p>
                        <p>Timeframe: <strong>${ai.prediction.timeframe}</strong></p>
                    </div>
                </div>
            </div>
            
            <!-- Sentiment Card -->
            <div class="ai-card sentiment-card ${sentimentClass}">
                <div class="ai-card-header">
                    <i class="fas fa-smile"></i>
                    <h4>Sentimen Pasar</h4>
                </div>
                <div class="ai-card-body">
                    <div class="sentiment-score">
                        <span class="score-value">${ai.sentiment_analysis.score}</span>
                        <span class="score-label">/ 100</span>
                    </div>
                    <p>Overall: <strong>${ai.sentiment_analysis.overall}</strong></p>
                    <p>News: <strong>${ai.sentiment_analysis.news_count}</strong> artikel</p>
                </div>
            </div>
            
            <!-- Risk Assessment Card -->
            <div class="ai-card risk-card ${riskClass}">
                <div class="ai-card-header">
                    <i class="fas fa-shield-alt"></i>
                    <h4>Risk Assessment</h4>
                </div>
                <div class="ai-card-body">
                    <div class="risk-level">
                        <span class="level-label">Level:</span>
                        <span class="level-badge ${riskClass}">${ai.risk_assessment.level}</span>
                    </div>
                    <p>Volatilitas: <strong>${ai.risk_assessment.volatility}%</strong></p>
                    <p>Risk Score: <strong>${ai.risk_assessment.score}/100</strong></p>
                </div>
            </div>
        </div>
        
        <!-- Insights -->
        <div class="ai-insights">
            <h4><i class="fas fa-lightbulb"></i> Insights</h4>
            <ul>
                ${ai.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
        </div>
        
        <!-- Disclaimer -->
        <div class="ai-disclaimer">
            <i class="fas fa-exclamation-circle"></i>
            <p>${ai.disclaimer}</p>
        </div>
    `;
}

// Utility Functions
function formatNumber(num) {
    if (num >= 1000) {
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return num.toFixed(4);
}

function formatLargeNumber(num) {
    if (!num) return '$0';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

function formatForexPrice(price, pair) {
    if (pair === 'USD/IDR' || pair === 'USD/THB') {
        return price.toFixed(2);
    }
    return price.toFixed(4);
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

function showLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
