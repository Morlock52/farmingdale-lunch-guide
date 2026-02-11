/**
 * Toast notification system for non-blocking user feedback
 */
const Toast = {
    container: null,
    queue: [],
    isProcessing: false,

    /**
     * Initializes the toast container
     */
    init() {
        try {
            if (this.container) {
                return true;
            }

            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.setAttribute('role', 'alert');
            this.container.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.container);

            console.info('Toast.init: Toast container initialized');
            return true;
        } catch (error) {
            console.error('Toast.init: Failed to initialize:', error.message);
            return false;
        }
    },

    /**
     * Shows a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 3000) {
        try {
            if (!this.container) {
                this.init();
            }

            if (typeof message !== 'string' || message.trim() === '') {
                console.warn('Toast.show: Invalid message');
                return;
            }

            const validTypes = ['success', 'error', 'warning', 'info'];
            if (!validTypes.includes(type)) {
                type = 'info';
            }

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.setAttribute('role', 'status');

            const icon = this.getIcon(type);
            toast.innerHTML = `
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${Utils.escapeHtml(message)}</span>
                <button class="toast-close" aria-label="Close notification">&times;</button>
            `;

            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.dismiss(toast));

            this.container.appendChild(toast);

            // Trigger animation
            requestAnimationFrame(() => {
                toast.classList.add('toast-visible');
            });

            // Auto dismiss
            if (duration > 0) {
                setTimeout(() => this.dismiss(toast), duration);
            }

        } catch (error) {
            console.error('Toast.show: Failed to show toast:', error.message);
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    /**
     * Gets icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon character
     */
    getIcon(type) {
        const icons = {
            success: '\u2713',
            error: '\u2717',
            warning: '\u26A0',
            info: '\u2139'
        };
        return icons[type] || icons.info;
    },

    /**
     * Dismisses a toast
     * @param {HTMLElement} toast - Toast element to dismiss
     */
    dismiss(toast) {
        try {
            if (!toast || !toast.parentNode) {
                return;
            }

            toast.classList.remove('toast-visible');
            toast.classList.add('toast-hiding');

            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        } catch (error) {
            console.error('Toast.dismiss: Failed to dismiss toast:', error.message);
        }
    },

    /**
     * Shows a success toast
     * @param {string} message - Message to display
     */
    success(message) {
        this.show(message, 'success');
    },

    /**
     * Shows an error toast
     * @param {string} message - Message to display
     */
    error(message) {
        this.show(message, 'error', 5000);
    },

    /**
     * Shows a warning toast
     * @param {string} message - Message to display
     */
    warning(message) {
        this.show(message, 'warning', 4000);
    },

    /**
     * Shows an info toast
     * @param {string} message - Message to display
     */
    info(message) {
        this.show(message, 'info');
    },

    /**
     * Clears all toasts
     */
    clearAll() {
        try {
            if (this.container) {
                this.container.innerHTML = '';
            }
        } catch (error) {
            console.error('Toast.clearAll: Failed to clear toasts:', error.message);
        }
    }
};
