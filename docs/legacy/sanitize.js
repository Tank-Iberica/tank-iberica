// ============================================
// TANK IBERICA - HTML Sanitization Helper
// ============================================
// Escapa caracteres peligrosos para prevenir XSS
// cuando se usa innerHTML con datos dinámicos.

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
