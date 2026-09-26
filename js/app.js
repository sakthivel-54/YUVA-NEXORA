/**
 * NEXORA — Frontend Application Logic (Week 2 Modular Architecture)
 * Scope: Interactive UI Components (Tabs, Accordion, Modal, Toast Notifications, Mobile Menu)
 * Architecture: Clean Vanilla ES6+, No global pollution, Event Delegation, Accessible Keyboard Management
 */

(function () {
  'use strict';

  // State reference for currently focused trigger element before opening modal
  let activeModalTrigger = null;

  /* --------------------------------------------------------------------------
     1. Toast Notification System
     -------------------------------------------------------------------------- */
  /**
   * Displays a non-blocking toast notification inside the live-region container.
   * @param {string} message - Text notification to display
   * @param {'success'|'info'|'warning'|'error'} [type='success'] - Toast classification
   * @param {number} [duration=4000] - Duration in ms before auto-dismissal
   */
  function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.setAttribute('role', 'status');

    // Distinct SVG icons per status type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
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
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss);

    // Auto dismiss after specified duration
    const timeoutId = setTimeout(dismiss, duration);

    // Pause dismissal if user hovers over toast
    toast.addEventListener('mouseenter', () => clearTimeout(timeoutId));

    container.appendChild(toast);
  }

  // Helper utility to prevent XSS in dynamic strings
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* --------------------------------------------------------------------------
     2. Mobile Navigation Menu
     -------------------------------------------------------------------------- */
  function initMobileMenu() {
    const toggleBtn = document.getElementById('nav-toggle-btn');
    const mobileMenu = document.getElementById('nav-mobile-menu');

    if (!toggleBtn || !mobileMenu) return;

    function openMenu() {
      toggleBtn.setAttribute('aria-expanded', 'true');
      mobileMenu.removeAttribute('hidden');
      mobileMenu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      // Focus first link in mobile menu
      const firstLink = mobileMenu.querySelector('a, button');
      if (firstLink) firstLink.focus();
    }

    function closeMenu() {
      toggleBtn.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('hidden', '');
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
      toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on navigation link click
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  }

  /* --------------------------------------------------------------------------
     3. Accessible Tabs Component (W3C ARIA Tab Pattern)
     -------------------------------------------------------------------------- */
  function initTabs() {
    const tablists = document.querySelectorAll('[role="tablist"]');
    if (!tablists.length) return;

    tablists.forEach((tablist) => {
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
          activateTab(tab, tabs);
        });

        // W3C Keyboard support: Arrow keys, Home, End
        tab.addEventListener('keydown', (e) => {
          let targetIndex = null;

          if (e.key === 'ArrowRight') {
            targetIndex = (index + 1) % tabs.length;
          } else if (e.key === 'ArrowLeft') {
            targetIndex = (index - 1 + tabs.length) % tabs.length;
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
     4. Accessible Accordion Component (FAQ / Help Section)
     -------------------------------------------------------------------------- */
  function initAccordion() {
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');
    if (!accordionTriggers.length) return;

    accordionTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
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
    });
  }

  /* --------------------------------------------------------------------------
     5. Accessible Modal Component (Focus Trap & Restoration)
     -------------------------------------------------------------------------- */
  function initModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const openBtns = document.querySelectorAll('[data-modal-open]');
    const closeBtns = modal.querySelectorAll('[data-modal-close]');
    const modalContainer = modal.querySelector('.modal-container');

    function openModal(triggerElement) {
      activeModalTrigger = triggerElement || document.activeElement;
      modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside modal
      const focusable = getFocusableElements(modalContainer);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    function closeModal() {
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';

      // Restore focus to original trigger element
      if (activeModalTrigger && typeof activeModalTrigger.focus === 'function') {
        activeModalTrigger.focus();
      }
      activeModalTrigger = null;
    }

    openBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        openModal(e.currentTarget);
      });
    });

    closeBtns.forEach((btn) => {
      btn.addEventListener('click', closeModal);
    });

    // Close when clicking on backdrop outside modal container
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Keyboard handlers: Escape to close, Tab to trap focus
    document.addEventListener('keydown', (e) => {
      if (modal.hasAttribute('hidden')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements(modalContainer);
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
     6. Demo Interactive Toast Triggers
     -------------------------------------------------------------------------- */
  function initToastTriggers() {
    const demoButtons = document.querySelectorAll('[data-toast-msg]');
    demoButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-toast-msg') || 'Action completed successfully';
        const type = btn.getAttribute('data-toast-type') || 'success';
        showToast(msg, type);
      });
    });
  }

  /* --------------------------------------------------------------------------
     7. Initialization on DOMContentLoaded
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initTabs();
    initAccordion();
    initModal();
    initToastTriggers();
  });

  // Expose showToast globally for reuse
  window.showToast = showToast;
})();
