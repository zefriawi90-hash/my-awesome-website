// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // Only scroll if href is valid (not just "#")
        if (href && href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Header scroll effect
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }

    lastScroll = currentScroll;
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Check for saved dark mode preference
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    darkModeToggle.querySelector('.toggle-icon').textContent = '☀️';
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    // Update icon
    const isDarkMode = body.classList.contains('dark-mode');
    darkModeToggle.querySelector('.toggle-icon').textContent = isDarkMode ? '☀️' : '🌙';
    
    // Save preference
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scroll-to-top');

if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Interactive Starfield
const starfieldCanvas = document.getElementById('starfield');
if (starfieldCanvas) {
    const ctx = starfieldCanvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    starfieldCanvas.width = width;
    starfieldCanvas.height = height;
    
    // Mouse position
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    
    // Stars array
    const stars = [];
    const starCount = 200;
    
    // Create stars
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            brightness: Math.random() * 0.5 + 0.5,
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
    
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        starfieldCanvas.width = width;
        starfieldCanvas.height = height;
        
        // Reposition stars on resize
        stars.forEach(star => {
            if (star.x > width) star.x = Math.random() * width;
            if (star.y > height) star.y = Math.random() * height;
        });
    });
    
    // Animation loop
    let time = 0;
    function animate() {
        time += 1;
        
        // Smooth mouse movement
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        // Calculate mouse influence
        const mouseInfluenceX = (mouseX - width / 2) / width;
        const mouseInfluenceY = (mouseY - height / 2) / height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw stars
        stars.forEach((star, index) => {
            // Calculate movement based on mouse position
            const moveX = mouseInfluenceX * 2;
            const moveY = mouseInfluenceY * 2;
            
            star.x += star.speedX + moveX;
            star.y += star.speedY + moveY;
            
            // Wrap around screen
            if (star.x < 0) star.x = width;
            if (star.x > width) star.x = 0;
            if (star.y < 0) star.y = height;
            if (star.y > height) star.y = 0;
            
            // Twinkle effect
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
            const alpha = star.brightness * twinkle;
            
            // Draw star with glow
            ctx.beginPath();
            const starGradient = ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.size * 3
            );
            starGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            starGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.5})`);
            starGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = starGradient;
            ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bright core
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
}

// ============ GLOBAL UTILITY FUNCTIONS ============

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    updateNavigation();
}

// Update navigation based on auth state
function updateNavigation(isLoggedIn = false, user = null) {
    const navMenu = document.getElementById('nav-menu');
    
    if (isLoggedIn) {
        if (user.role === 'admin') {
            navMenu.innerHTML = `
                <li><a href="#" class="nav-link" onclick="showSection('dashboard')">Dashboard</a></li>
                <li><a href="#" class="nav-link" onclick="showMarketSection()">Market</a></li>
                <li><a href="#" class="nav-link" onclick="showSection('football')">Sepak Bola</a></li>
                <li><a href="#" class="nav-link" onclick="showSection('admin')">Admin Panel</a></li>
                <li><a href="#" class="nav-link" onclick="logout()">Logout</a></li>
            `;
        } else {
            navMenu.innerHTML = `
                <li><a href="#" class="nav-link" onclick="showSection('dashboard')">Dashboard</a></li>
                <li><a href="#" class="nav-link" onclick="showMarketSection()">Market</a></li>
                <li><a href="#" class="nav-link" onclick="showSection('football')">Sepak Bola</a></li>
                <li><a href="#" class="nav-link" onclick="logout()">Logout</a></li>
            `;
        }
    } else {
        navMenu.innerHTML = `
            <li><a href="#" class="nav-link" onclick="showSection('home')">Beranda</a></li>
            <li><a href="#" class="nav-link" onclick="showSection('home'); setTimeout(() => showAuth('login'), 100)">Login</a></li>
        `;
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Loading overlay
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

// Page is already visible by default
// No need for opacity transition as it can cause display issues

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    // Load saved background settings
    loadBackgroundSettings();
});

// ============ BACKGROUND SETTINGS ============

// Default background
const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';

// Background Settings Modal
const bgSettingsModal = document.getElementById('bg-settings-modal');
const bgSettingsToggle = document.getElementById('bg-settings-toggle');

// Open background settings modal
bgSettingsToggle.addEventListener('click', () => {
    bgSettingsModal.classList.add('show');
});

// Close background settings modal
function closeBgSettingsModal() {
    bgSettingsModal.classList.remove('show');
}

// Close modal when clicking outside
bgSettingsModal.addEventListener('click', (e) => {
    if (e.target === bgSettingsModal) {
        closeBgSettingsModal();
    }
});

// Select background type
function selectBgType(type) {
    // Update button states
    document.querySelectorAll('.bg-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // Show/hide option panels
    document.querySelectorAll('.bg-option-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${type}-options`).classList.add('active');
    
    // Save background type preference
    localStorage.setItem('bgType', type);
}

// Apply gradient background
function applyGradient(gradientValue) {
    const hero = document.querySelector('.hero');
    hero.style.background = gradientValue;
    hero.classList.remove('hero-image');
    
    // Save to localStorage
    localStorage.setItem('heroBackground', gradientValue);
    localStorage.setItem('bgType', 'gradient');
    
    showToast('Background gradient diterapkan!', 'success');
}

// Apply solid color background
function applySolidColor(colorValue) {
    const hero = document.querySelector('.hero');
    hero.style.background = colorValue;
    hero.classList.remove('hero-image');
    
    // Update color value display
    document.getElementById('solid-color-value').textContent = colorValue;
    
    // Save to localStorage
    localStorage.setItem('heroBackground', colorValue);
    localStorage.setItem('bgType', 'solid');
    
    showToast('Background warna diterapkan!', 'success');
}

// Apply image URL background
function applyImageUrl(imageUrl) {
    if (!imageUrl) return;
    
    const hero = document.querySelector('.hero');
    hero.style.background = `url("${imageUrl}") center/cover no-repeat`;
    hero.classList.add('hero-image');
    
    // Save to localStorage
    localStorage.setItem('heroBackground', `url("${imageUrl}")`);
    localStorage.setItem('bgType', 'image');
    
    showToast('Background gambar diterapkan!', 'success');
}

// Apply image preset
function applyImagePreset(imageUrl) {
    const hero = document.querySelector('.hero');
    hero.style.background = `url("${imageUrl}") center/cover no-repeat fixed`;
    hero.classList.add('hero-image');
    
    // Update URL input
    document.getElementById('bg-image-url').value = imageUrl;
    
    // Save to localStorage
    localStorage.setItem('heroBackground', `url("${imageUrl}")`);
    localStorage.setItem('bgType', 'image');
    
    showToast('Background gambar diterapkan!', 'success');
}

// Reset to default background
function resetToDefault() {
    const hero = document.querySelector('.hero');
    hero.style.background = DEFAULT_BACKGROUND;
    hero.classList.remove('hero-image');
    
    // Reset localStorage
    localStorage.removeItem('heroBackground');
    localStorage.removeItem('bgType');
    
    showToast('Background direset ke default!', 'success');
}

// Load saved background settings
function loadBackgroundSettings() {
    const savedBackground = localStorage.getItem('heroBackground');
    const savedBgType = localStorage.getItem('bgType');
    
    const hero = document.querySelector('.hero');
    
    if (savedBackground) {
        if (savedBackground.startsWith('url(')) {
            hero.style.background = savedBackground + ' center/cover no-repeat fixed';
            hero.classList.add('hero-image');
        } else {
            hero.style.background = savedBackground;
            hero.classList.remove('hero-image');
        }
    } else {
        // Apply default background
        hero.style.background = DEFAULT_BACKGROUND;
    }
    
    // Update UI if modal is open
    if (savedBgType && document.getElementById('bg-settings-modal').classList.contains('show')) {
        selectBgType(savedBgType);
    }
}


