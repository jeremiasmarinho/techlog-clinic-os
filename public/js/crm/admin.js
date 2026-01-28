// ============================================
// Admin Panel - Mobile Menu & UI Controls
// ============================================

/**
 * Toggle Mobile Sidebar Menu
 * Handles the opening/closing of the mobile sidebar with smooth animations
 */
function toggleMobileMenu() {
    const sidebar = document.getElementById('mobileSidebar');
    const sidebarPanel = document.getElementById('mobileSidebarPanel');
    
    if (!sidebar || !sidebarPanel) {
        console.error('Mobile menu elements not found');
        return;
    }
    
    // Check if sidebar is currently hidden
    const isHidden = sidebar.classList.contains('hidden');
    
    if (isHidden) {
        // Show sidebar
        sidebar.classList.remove('hidden');
        
        // Force reflow to ensure transition works
        void sidebarPanel.offsetWidth;
        
        // Slide in the panel
        sidebarPanel.classList.remove('-translate-x-full');
        sidebarPanel.classList.add('translate-x-0');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
    } else {
        // Slide out the panel
        sidebarPanel.classList.remove('translate-x-0');
        sidebarPanel.classList.add('-translate-x-full');
        
        // Hide sidebar after animation completes
        setTimeout(() => {
            sidebar.classList.add('hidden');
        }, 300); // Match the transition duration
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

/**
 * Sync user name between header and sidebar
 * Called when user data is loaded
 */
function syncUserName(userName) {
    const userNameElement = document.getElementById('userName');
    const userNameSidebarElement = document.getElementById('userNameSidebar');
    
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }
    
    if (userNameSidebarElement && userName) {
        userNameSidebarElement.textContent = userName;
    }
}

/**
 * Sync team button visibility (Admin only)
 * Shows/hides the team management button based on user role
 */
function syncTeamButtonVisibility(isAdmin) {
    const teamButton = document.getElementById('teamButton');
    const teamButtonSidebar = document.getElementById('teamButtonSidebar');
    
    if (teamButton) {
        if (isAdmin) {
            teamButton.classList.remove('hidden');
            teamButton.classList.add('flex');
        } else {
            teamButton.classList.add('hidden');
            teamButton.classList.remove('flex');
        }
    }
    
    if (teamButtonSidebar) {
        if (isAdmin) {
            teamButtonSidebar.classList.remove('hidden');
            teamButtonSidebar.classList.add('flex');
        } else {
            teamButtonSidebar.classList.add('hidden');
            teamButtonSidebar.classList.remove('flex');
        }
    }
}

/**
 * Sync privacy mode icons
 * Updates the privacy mode icons in both header and sidebar
 */
function syncPrivacyIcons(isPrivacyMode) {
    const privacyIcon = document.getElementById('privacyIcon');
    const privacyIconSidebar = document.getElementById('privacyIconSidebar');
    
    const iconClass = isPrivacyMode ? 'fa-eye-slash' : 'fa-eye';
    
    if (privacyIcon) {
        privacyIcon.className = `fas ${iconClass}`;
    }
    
    if (privacyIconSidebar) {
        privacyIconSidebar.className = `fas ${iconClass} text-xl w-6`;
    }
}

/**
 * Close mobile menu when clicking outside on mobile
 * Handles the backdrop click event
 */
document.addEventListener('DOMContentLoaded', function() {
    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('mobileSidebar');
            if (sidebar && !sidebar.classList.contains('hidden')) {
                toggleMobileMenu();
            }
        }
    });
    
    // Prevent body scroll when modal or sidebar is open
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                const sidebar = document.getElementById('mobileSidebar');
                if (sidebar && !sidebar.classList.contains('hidden')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    // Check if any modal is open
                    const modals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
                    if (modals.length === 0) {
                        document.body.style.overflow = '';
                    }
                }
            }
        });
    });
    
    const sidebar = document.getElementById('mobileSidebar');
    if (sidebar) {
        observer.observe(sidebar, { attributes: true });
    }
});

/**
 * Override togglePrivacyMode to sync icons
 * Wraps the existing togglePrivacyMode function
 */
if (typeof togglePrivacyMode !== 'undefined') {
    const originalTogglePrivacyMode = togglePrivacyMode;
    togglePrivacyMode = function() {
        originalTogglePrivacyMode();
        // Sync the privacy icons after toggle
        syncPrivacyIcons(privacyMode);
    };
}

/**
 * Handle window resize
 * Close mobile menu if window is resized to desktop size
 */
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // If window width is >= 768px (md breakpoint), close mobile menu
        if (window.innerWidth >= 768) {
            const sidebar = document.getElementById('mobileSidebar');
            const sidebarPanel = document.getElementById('mobileSidebarPanel');
            
            if (sidebar && !sidebar.classList.contains('hidden')) {
                sidebar.classList.add('hidden');
                if (sidebarPanel) {
                    sidebarPanel.classList.remove('translate-x-0');
                    sidebarPanel.classList.add('-translate-x-full');
                }
                document.body.style.overflow = '';
            }
        }
    }, 250);
});

// Console log for debugging
console.log('✅ Admin.js loaded - Mobile menu functionality active');

// Load summary metrics on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadSummaryMetrics === 'function') {
        loadSummaryMetrics();
    }
});
