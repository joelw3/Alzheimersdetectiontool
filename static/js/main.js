// Main JavaScript file for the application

// Font size adjustment
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved font size
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.documentElement.style.fontSize = savedFontSize + 'px';
    }
});

// Function to adjust font size
function adjustFontSize(delta) {
    const currentSize = parseInt(window.getComputedStyle(document.documentElement).fontSize);
    const newSize = Math.max(12, Math.min(24, currentSize + delta));
    document.documentElement.style.fontSize = newSize + 'px';
    localStorage.setItem('fontSize', newSize);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + + to increase font
    if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        adjustFontSize(2);
    }
    // Ctrl/Cmd + - to decrease font
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        adjustFontSize(-2);
    }
});
