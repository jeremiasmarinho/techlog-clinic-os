/**
 * 🎨 Avatar Color System
 *
 * Deterministic color assignment based on patient name.
 * Each name always gets the same vibrant color.
 * Works in both dark and light modes via CSS classes.
 */

const AVATAR_COLORS = [
    'avatar-coral', // Warm coral/red
    'avatar-violet', // Rich violet
    'avatar-ocean', // Ocean blue
    'avatar-emerald', // Fresh emerald
    'avatar-amber', // Warm amber
    'avatar-rose', // Soft rose
    'avatar-indigo', // Deep indigo
    'avatar-teal', // Bright teal
    'avatar-fuchsia', // Vivid fuchsia
    'avatar-sky', // Sky blue
    'avatar-lime', // Fresh lime
    'avatar-orange', // Bold orange
] as const;

/**
 * Get a deterministic avatar color class based on the name.
 * Same name always returns the same color.
 */
function getAvatarColorClass(name: string): string {
    if (!name) return AVATAR_COLORS[0];

    // Simple hash from name
    let hash = 0;
    const normalized = name.trim().toLowerCase();
    for (let i = 0; i < normalized.length; i++) {
        hash = (hash << 5) - hash + normalized.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit int
    }

    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

/**
 * Get initials from a name (1-2 letters).
 */
function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Build a complete avatar HTML element.
 * @param name - Patient/user name
 * @param size - 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 */
function buildAvatarHTML(name: string, size: 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
    const colorClass = getAvatarColorClass(name);
    const initials = getInitials(name);

    const sizeMap = {
        sm: 'avatar-profile avatar-profile-sm',
        md: 'avatar-profile',
        lg: 'avatar-profile avatar-profile-lg',
        xl: 'avatar-profile avatar-profile-xl',
    };

    return `<div class="${sizeMap[size]} ${colorClass}">${initials}</div>`;
}

// Export globally
(window as Record<string, unknown>).getAvatarColorClass = getAvatarColorClass;
(window as Record<string, unknown>).getInitials = getInitials;
(window as Record<string, unknown>).buildAvatarHTML = buildAvatarHTML;

declare global {
    function getAvatarColorClass(name: string): string;
    function getInitials(name: string): string;
    function buildAvatarHTML(name: string, size?: 'sm' | 'md' | 'lg' | 'xl'): string;
}
