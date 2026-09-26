/**
 * NEXORA — Frontend Application Logic (Week 4 Performance Optimized)
 * Scope: High-Performance, Accessible UI Components (Tabs, Accordion, Modal, Toast Notifications, Mobile Navigation)
 * Architecture: Event Delegation, Cached DOM Queries, Minimal Garbage Collection, Zero Layout Reflows
 */

(function () {
  'use strict';

  // Cached DOM references
  const DOM = {
    toastContainer: null,
    navToggleBtn: null,
    mobileMenu: null,
    modal: null,
    modalContainer: null
  };

  // State reference for currently focused trigger element before opening modal
  let activeModalTrigger = null;

  /* --------------------------------------------------------------------------
     1. Toast Notification Subsystem
     -------------------------------------------------------------------------- */
  /**
   * Displays a non-blocking toast notification inside the live-region container.
   * @param {string} message - Text notification to display
   * @param {'success'|'info'|'warning'|'error'} [type='success'] - Toast classification
   * @param {number} [duration=4000] - Duration in ms before auto-dismissal
   */
  function showToast(message, type = 'success', duration = 4000) {
    if (!DOM.toastContainer) {
      DOM.toastContainer = document.getElementById('toast-container');
    }
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.setAttribute('role', 'status');

    // Distinct SVG icons per status type (inline vectors, zero network overhead)
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-content">
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button type="button" class="toast-close-btn" aria-label="Dismiss notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      // GPU accelerated exit animation
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss, { once: true });

    // Auto dismiss after specified duration
    const timeoutId = setTimeout(dismiss, duration);

    // Pause dismissal if user hovers over toast
    toast.addEventListener('mouseenter', () => clearTimeout(timeoutId), { once: true });

    DOM.toastContainer.appendChild(toast);
  }

  // Safe string sanitization to prevent XSS
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* --------------------------------------------------------------------------
     2. Mobile Navigation Menu
     -------------------------------------------------------------------------- */
  function initMobileMenu() {
    DOM.navToggleBtn = document.getElementById('nav-toggle-btn');
    DOM.mobileMenu = document.getElementById('nav-mobile-menu');

    if (!DOM.navToggleBtn || !DOM.mobileMenu) return;

    function openMenu() {
      DOM.navToggleBtn.setAttribute('aria-expanded', 'true');
      DOM.mobileMenu.removeAttribute('hidden');
      DOM.mobileMenu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      const firstLink = DOM.mobileMenu.querySelector('a, button');
      if (firstLink) firstLink.focus();
    }

    function closeMenu() {
      DOM.navToggleBtn.setAttribute('aria-expanded', 'false');
      DOM.mobileMenu.setAttribute('hidden', '');
      DOM.mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
      DOM.navToggleBtn.focus();
    }

    DOM.navToggleBtn.addEventListener('click', () => {
      const isExpanded = DOM.navToggleBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Event delegation: Close menu when clicking navigation link
    DOM.mobileMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.navToggleBtn.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  }

  /* --------------------------------------------------------------------------
     3. Accessible Tabs with Event Delegation
     -------------------------------------------------------------------------- */
  function initTabs() {
    const tablists = document.querySelectorAll('[role="tablist"]');
    if (!tablists.length) return;

    tablists.forEach((tablist) => {
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

      // Event delegation on tablist container for click events
      tablist.addEventListener('click', (e) => {
        const tab = e.target.closest('[role="tab"]');
        if (tab && tablist.contains(tab)) {
          activateTab(tab, tabs);
        }
      });

      // W3C Keyboard support: Arrow keys, Home, End
      tablist.addEventListener('keydown', (e) => {
        const tab = e.target.closest('[role="tab"]');
        if (!tab || !tablist.contains(tab)) return;

        const currentIndex = tabs.indexOf(tab);
        if (currentIndex === -1) return;

        let targetIndex = null;

        if (e.key === 'ArrowRight') {
          targetIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
          targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = tabs.length - 1;
        }

        if (targetIndex !== null) {
          e.preventDefault();
          tabs[targetIndex].focus();
          activateTab(tabs[targetIndex], tabs);
        }
      });
    });

    function activateTab(selectedTab, allTabs) {
      allTabs.forEach((tab) => {
        const isSelected = tab === selectedTab;
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');

        const panelId = tab.getAttribute('aria-controls');
        if (panelId) {
          const panel = document.getElementById(panelId);
          if (panel) {
            if (isSelected) {
              panel.removeAttribute('hidden');
            } else {
              panel.setAttribute('hidden', '');
            }
          }
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     4. Accessible Accordion with Event Delegation
     -------------------------------------------------------------------------- */
  function initAccordion() {
    // Single delegated listener for all accordions
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.accordion-trigger');
      if (!trigger) return;

      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const panelId = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);

      if (!panel) return;

      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Accessible Modal with Focus Trap & Event Delegation
     -------------------------------------------------------------------------- */
  function initModal() {
    DOM.modal = document.getElementById('project-modal');
    if (!DOM.modal) return;

    DOM.modalContainer = DOM.modal.querySelector('.modal-container');

    function openModal(triggerElement) {
      activeModalTrigger = triggerElement || document.activeElement;
      DOM.modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside modal
      const focusable = getFocusableElements(DOM.modalContainer);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    function closeModal() {
      if (DOM.modal.hasAttribute('hidden')) return;
      DOM.modal.setAttribute('hidden', '');
      document.body.style.overflow = '';

      // Restore focus to original trigger
      if (activeModalTrigger && typeof activeModalTrigger.focus === 'function') {
        activeModalTrigger.focus();
      }
      activeModalTrigger = null;
    }

    // Event delegation for opening modals via [data-modal-open]
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-modal-open]');
      if (openBtn) {
        e.preventDefault();
        openModal(openBtn);
        return;
      }

      // Event delegation for closing modals via [data-modal-close]
      const closeBtn = e.target.closest('[data-modal-close]');
      if (closeBtn && DOM.modal.contains(closeBtn)) {
        e.preventDefault();
        closeModal();
        return;
      }

      // Close when clicking directly on the backdrop outside the container
      if (e.target === DOM.modal) {
        closeModal();
      }
    });

    // Keyboard handlers: Escape to close, Tab to trap focus
    document.addEventListener('keydown', (e) => {
      if (DOM.modal.hasAttribute('hidden')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements(DOM.modalContainer);
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });

    function getFocusableElements(element) {
      if (!element) return [];
      return Array.from(
        element.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    }
  }

  /* --------------------------------------------------------------------------
     6. Delegated Toast Triggers
     -------------------------------------------------------------------------- */
  function initToastTriggers() {
    // Single event listener on document for any [data-toast-msg] triggers
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-toast-msg]');
      if (!btn) return;

      const msg = btn.getAttribute('data-toast-msg') || 'Action completed successfully';
      const type = btn.getAttribute('data-toast-type') || 'success';
      showToast(msg, type);
    });
  }

  /* --------------------------------------------------------------------------
     7. Initialization
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initTabs();
    initAccordion();
    initModal();
    initToastTriggers();
  });

  // Expose showToast globally for dashboard or programmatic reuse
  window.showToast = showToast;
})();
