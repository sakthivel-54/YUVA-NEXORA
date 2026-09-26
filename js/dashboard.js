/**
 * NEXORA — Dashboard Application Architecture (Week 5 Final Milestone)
 * Scope: Centralized State Management, Dynamic JSON Binding, Search, Multi-Filter,
 *        Sorting, Lightweight Visual Charts, Accessible Modals & Error Resilience.
 * Architecture: Clean Vanilla ES6+, No external dependencies, Zero layout reflows.
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Centralized Application State
     -------------------------------------------------------------------------- */
  const state = {
    projects: [],
    team: [],
    tasks: [],
    activity: [],
    filteredProjects: [],
    filters: {
      status: 'all',
      priority: 'all',
      category: 'all'
    },
    searchTerm: '',
    sort: {
      key: 'name',
      direction: 'asc'
    },
    loading: false,
    error: null
  };

  // State reference for currently focused trigger element before opening modal
  let activeModalTrigger = null;

  /* --------------------------------------------------------------------------
     2. Cached DOM Elements
     -------------------------------------------------------------------------- */
  const DOM = {};

  function cacheDOMElements() {
    DOM.loadingState = document.getElementById('loading-state-container');
    DOM.errorState = document.getElementById('error-state-container');
    DOM.errorMessage = document.getElementById('error-message-text');
    DOM.retryBtn = document.getElementById('retry-fetch-btn');
    DOM.contentArea = document.getElementById('dashboard-content-area');

    DOM.refreshBtn = document.getElementById('refresh-btn');
    DOM.refreshIcon = document.getElementById('refresh-icon');
    DOM.refreshLabel = document.getElementById('refresh-btn-label');
    DOM.lastSyncTime = document.getElementById('last-sync-time');

    // Overview metric cards
    DOM.metricTotal = document.getElementById('metric-total-projects');
    DOM.metricActive = document.getElementById('metric-active-projects');
    DOM.metricCompleted = document.getElementById('metric-completed-projects');
    DOM.metricTeam = document.getElementById('metric-team-count');
    DOM.metricTasks = document.getElementById('metric-task-count');
    DOM.metricAvgProgress = document.getElementById('metric-avg-progress');
    DOM.metricAvgProgressFill = document.getElementById('metric-avg-progress-fill');
    DOM.metricAvgProgressBar = document.getElementById('metric-avg-progress-bar');

    // Charts
    DOM.statusChart = document.getElementById('status-chart-container');
    DOM.statusAccessibleTbody = document.getElementById('status-accessible-tbody');
    DOM.categoryChart = document.getElementById('category-chart-container');

    // Filter & Search
    DOM.searchInput = document.getElementById('search-input');
    DOM.filterStatus = document.getElementById('filter-status');
    DOM.filterPriority = document.getElementById('filter-priority');
    DOM.filterCategory = document.getElementById('filter-category');
    DOM.resetFiltersBtn = document.getElementById('reset-filters-btn');
    DOM.resultsCount = document.getElementById('results-count-label');

    // Table
    DOM.table = document.getElementById('projects-table');
    DOM.tableBody = document.getElementById('projects-table-body');
    DOM.emptyState = document.getElementById('table-empty-state');
    DOM.emptyResetBtn = document.getElementById('empty-reset-btn');

    // Team & Activity
    DOM.teamGrid = document.getElementById('team-grid-container');
    DOM.activityFeed = document.getElementById('activity-feed-container');

    // Modal
    DOM.modal = document.getElementById('project-detail-modal');
    DOM.modalContainer = DOM.modal ? DOM.modal.querySelector('.modal-container') : null;
    DOM.toastContainer = document.getElementById('toast-container');
  }

  /* --------------------------------------------------------------------------
     3. Toast Notification Helper
     -------------------------------------------------------------------------- */
  function showToast(message, type = 'success', duration = 3500) {
    if (!DOM.toastContainer) {
      DOM.toastContainer = document.getElementById('toast-container');
    }
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.setAttribute('role', 'status');

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
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
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss, { once: true });
    const timeoutId = setTimeout(dismiss, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timeoutId), { once: true });

    DOM.toastContainer.appendChild(toast);
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* --------------------------------------------------------------------------
     4. Data Validation Subsystem
     -------------------------------------------------------------------------- */
  /**
   * Strictly validates incoming JSON payload before updating application state.
   * Handles missing properties, invalid types, clamped numbers, and corrupt entries.
   */
  function validateWorkspaceData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Malformed workspace payload: Root object missing.');
    }

    const validProjects = [];
    if (Array.isArray(data.projects)) {
      data.projects.forEach((proj, idx) => {
        if (!proj || typeof proj !== 'object') return;

        const id = typeof proj.id === 'string' ? proj.id.trim() : `PRJ-${idx + 100}`;
        const name = typeof proj.name === 'string' && proj.name.trim() !== '' ? proj.name.trim() : 'Unnamed Project';
        const category = typeof proj.category === 'string' && proj.category.trim() !== '' ? proj.category.trim() : 'General';
        const owner = typeof proj.owner === 'string' && proj.owner.trim() !== '' ? proj.owner.trim() : 'Unassigned';

        const rawStatus = typeof proj.status === 'string' ? proj.status.trim() : 'Active';
        const status = ['Active', 'Completed', 'On Hold', 'At Risk'].includes(rawStatus) ? rawStatus : 'Active';

        let progress = parseInt(proj.progress, 10);
        if (isNaN(progress)) progress = 0;
        progress = Math.max(0, Math.min(100, progress));

        const rawPriority = typeof proj.priority === 'string' ? proj.priority.trim() : 'Medium';
        const priority = ['High', 'Medium', 'Low'].includes(rawPriority) ? rawPriority : 'Medium';

        const deadline = typeof proj.deadline === 'string' ? proj.deadline.trim() : '2026-12-31';
        const teamSize = parseInt(proj.teamSize, 10) || 1;
        const description = typeof proj.description === 'string' ? proj.description.trim() : '';

        validProjects.push({
          id,
          name,
          category,
          owner,
          status,
          progress,
          priority,
          deadline,
          teamSize,
          description
        });
      });
    }

    const validTeam = Array.isArray(data.team) ? data.team.map((member, i) => ({
      id: member.id || `TM-${i + 1}`,
      name: member.name || 'Anonymous Contributor',
      role: member.role || 'Software Engineer',
      project: member.project || 'Unallocated',
      status: member.status || 'Active',
      taskCount: parseInt(member.taskCount, 10) || 0,
      initials: member.initials || (member.name ? member.name.substring(0, 2).toUpperCase() : 'NA')
    })) : [];

    const validTasks = Array.isArray(data.tasks) ? data.tasks.map((task, i) => ({
      id: task.id || `TSK-${i + 1}`,
      projectId: task.projectId || '',
      title: task.title || 'Untitled Task',
      status: task.status || 'Pending',
      priority: task.priority || 'Medium',
      assignee: task.assignee || 'Unassigned'
    })) : [];

    const validActivity = Array.isArray(data.activity) ? data.activity.map((act, i) => ({
      id: act.id || `ACT-${i + 1}`,
      user: act.user || 'System',
      action: act.action || 'performed an update',
      target: act.target || 'Workspace',
      timestamp: act.timestamp || new Date().toISOString(),
      type: act.type || 'system'
    })) : [];

    return {
      projects: validProjects,
      team: validTeam,
      tasks: validTasks,
      activity: validActivity
    };
  }

  /* --------------------------------------------------------------------------
     5. Asynchronous Data Fetching & Refresh Engine
     -------------------------------------------------------------------------- */
  async function fetchWorkspaceData(isRefresh = false) {
    state.loading = true;
    state.error = null;

    if (DOM.loadingState && !isRefresh) {
      DOM.loadingState.style.display = 'flex';
      DOM.contentArea.style.opacity = '0.3';
    }
    if (DOM.errorState) {
      DOM.errorState.style.display = 'none';
    }

    if (isRefresh && DOM.refreshBtn) {
      DOM.refreshBtn.disabled = true;
      DOM.refreshIcon.classList.add('spinner');
      DOM.refreshLabel.textContent = 'Refreshing...';
    }

    try {
      // Cache-busting parameter guarantees fresh JSON retrieval on refresh
      const response = await fetch(`data/data.json?_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP network error: Server responded with status ${response.status}`);
      }

      const rawData = await response.json();
      const validated = validateWorkspaceData(rawData);

      // Mutate application state with clean data
      state.projects = validated.projects;
      state.team = validated.team;
      state.tasks = validated.tasks;
      state.activity = validated.activity;

      // Render all dashboard modules
      calculateAndRenderOverview();
      renderVisualCharts();
      renderTeamSection();
      renderActivityFeed();
      applyFiltersAndSort();

      // Update sync timestamp
      const now = new Date();
      if (DOM.lastSyncTime) {
        DOM.lastSyncTime.textContent = `Synced: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }

      if (isRefresh) {
        showToast('Workspace refreshed successfully', 'success');
      }
    } catch (err) {
      console.error('[NEXORA Dashboard Error]', err);
      state.error = err.message || 'Unable to load workspace data.';

      if (DOM.errorState) {
        DOM.errorState.style.display = 'flex';
        DOM.errorMessage.textContent = `${state.error} Verify that data/data.json exists and your local development server is running.`;
      }
      showToast('Failed to refresh workspace data', 'error');
    } finally {
      state.loading = false;
      if (DOM.loadingState) {
        DOM.loadingState.style.display = 'none';
        DOM.contentArea.style.opacity = '1';
      }
      if (isRefresh && DOM.refreshBtn) {
        DOM.refreshBtn.disabled = false;
        DOM.refreshIcon.classList.remove('spinner');
        DOM.refreshLabel.textContent = 'Refresh Workspace';
      }
    }
  }

  /* --------------------------------------------------------------------------
     6. Dynamic Overview Calculations
     -------------------------------------------------------------------------- */
  function calculateAndRenderOverview() {
    const totalProjects = state.projects.length;
    const activeProjects = state.projects.filter((p) => p.status === 'Active').length;
    const completedProjects = state.projects.filter((p) => p.status === 'Completed').length;
    const totalTeam = state.team.length;
    const totalTasks = state.tasks.length;

    let avgProgress = 0;
    if (totalProjects > 0) {
      const sum = state.projects.reduce((acc, curr) => acc + curr.progress, 0);
      avgProgress = Math.round(sum / totalProjects);
    }

    if (DOM.metricTotal) DOM.metricTotal.textContent = totalProjects;
    if (DOM.metricActive) DOM.metricActive.textContent = activeProjects;
    if (DOM.metricCompleted) DOM.metricCompleted.textContent = completedProjects;
    if (DOM.metricTeam) DOM.metricTeam.textContent = totalTeam;
    if (DOM.metricTasks) DOM.metricTasks.textContent = totalTasks;

    if (DOM.metricAvgProgress) DOM.metricAvgProgress.textContent = `${avgProgress}%`;
    if (DOM.metricAvgProgressFill) DOM.metricAvgProgressFill.style.width = `${avgProgress}%`;
    if (DOM.metricAvgProgressBar) {
      DOM.metricAvgProgressBar.setAttribute('aria-valuenow', avgProgress);
      DOM.metricAvgProgressBar.setAttribute('aria-label', `Average Workspace Progress: ${avgProgress}%`);
    }
  }

  /* --------------------------------------------------------------------------
     7. Lightweight Data Visualization (Vanilla HTML/CSS/JS)
     -------------------------------------------------------------------------- */
  function renderVisualCharts() {
    renderStatusChart();
    renderCategoryChart();
  }

  function renderStatusChart() {
    if (!DOM.statusChart) return;

    const total = state.projects.length;
    if (total === 0) {
      DOM.statusChart.innerHTML = '<p style="color: var(--color-text-muted); font-size: 13px;">No project data available.</p>';
      return;
    }

    const statuses = [
      { key: 'Active', label: '● Active', color: 'var(--status-active)' },
      { key: 'Completed', label: '✓ Completed', color: 'var(--status-completed)' },
      { key: 'At Risk', label: '! At Risk', color: 'var(--status-at-risk)' },
      { key: 'On Hold', label: '— On Hold', color: 'var(--status-on-hold)' }
    ];

    let html = '';
    let tableHtml = '';

    statuses.forEach((st) => {
      const count = state.projects.filter((p) => p.status === st.key).length;
      const percentage = Math.round((count / total) * 100);

      html += `
        <div class="chart-bar-row">
          <div class="chart-bar-meta">
            <span style="color: var(--color-text-primary); font-weight: 600;">${st.label}</span>
            <span style="color: var(--color-text-muted);">${count} ${count === 1 ? 'project' : 'projects'} (${percentage}%)</span>
          </div>
          <div class="chart-bar-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="${st.key} projects: ${count} of ${total} (${percentage}%)">
            <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${st.color};"></div>
          </div>
        </div>
      `;

      tableHtml += `
        <tr>
          <td>${st.label}</td>
          <td>${count}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    });

    DOM.statusChart.innerHTML = html;
    if (DOM.statusAccessibleTbody) {
      DOM.statusAccessibleTbody.innerHTML = tableHtml;
    }
  }

  function renderCategoryChart() {
    if (!DOM.categoryChart) return;

    const total = state.projects.length;
    if (total === 0) {
      DOM.categoryChart.innerHTML = '<p style="color: var(--color-text-muted); font-size: 13px;">No category data available.</p>';
      return;
    }

    // Dynamic category aggregation
    const catMap = {};
    state.projects.forEach((p) => {
      catMap[p.category] = (catMap[p.category] || 0) + 1;
    });

    const categories = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);

    let html = '';
    categories.forEach((cat) => {
      const count = catMap[cat];
      const percentage = Math.round((count / total) * 100);

      html += `
        <div class="chart-bar-row">
          <div class="chart-bar-meta">
            <span style="color: var(--color-text-primary);">${escapeHtml(cat)}</span>
            <span style="color: var(--color-text-muted);">${count} (${percentage}%)</span>
          </div>
          <div class="chart-bar-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="${cat}: ${count} projects (${percentage}%)">
            <div class="chart-bar-fill" style="width: ${percentage}%; background-color: var(--color-accent);"></div>
          </div>
        </div>
      `;
    });

    DOM.categoryChart.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     8. Search, Filtering, Sorting & Table Rendering
     -------------------------------------------------------------------------- */
  function applyFiltersAndSort() {
    const term = state.searchTerm.toLowerCase().trim();
    const { status, priority, category } = state.filters;

    // Filter projects matching all active criteria simultaneously
    state.filteredProjects = state.projects.filter((proj) => {
      const matchSearch =
        term === '' ||
        proj.name.toLowerCase().includes(term) ||
        proj.owner.toLowerCase().includes(term) ||
        proj.category.toLowerCase().includes(term) ||
        proj.id.toLowerCase().includes(term);

      const matchStatus = status === 'all' || proj.status === status;
      const matchPriority = priority === 'all' || proj.priority === priority;
      const matchCategory = category === 'all' || proj.category === category;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });

    // Sort filtered results
    const { key, direction } = state.sort;
    const factor = direction === 'asc' ? 1 : -1;

    state.filteredProjects.sort((a, b) => {
      if (key === 'progress' || key === 'teamSize') {
        return (a[key] - b[key]) * factor;
      }
      if (key === 'priority') {
        const order = { High: 3, Medium: 2, Low: 1 };
        return ((order[a.priority] || 0) - (order[b.priority] || 0)) * factor;
      }
      if (key === 'deadline') {
        return (new Date(a.deadline) - new Date(b.deadline)) * factor;
      }
      // String sort (name, owner, status, category)
      return a[key].localeCompare(b[key]) * factor;
    });

    renderProjectsTable();
    updateTableHeadersSortState();
  }

  function renderProjectsTable() {
    if (!DOM.tableBody) return;

    const count = state.filteredProjects.length;
    const total = state.projects.length;

    if (DOM.resultsCount) {
      DOM.resultsCount.textContent = `Showing ${count} of ${total} projects`;
    }

    if (count === 0) {
      DOM.tableBody.innerHTML = '';
      if (DOM.emptyState) DOM.emptyState.style.display = 'flex';
      return;
    }

    if (DOM.emptyState) DOM.emptyState.style.display = 'none';

    let tbodyHtml = '';
    state.filteredProjects.forEach((proj) => {
      let statusBadgeClass = 'status-active';
      let statusIcon = '●';
      if (proj.status === 'Completed') {
        statusBadgeClass = 'status-completed';
        statusIcon = '✓';
      } else if (proj.status === 'At Risk') {
        statusBadgeClass = 'status-at-risk';
        statusIcon = '!';
      } else if (proj.status === 'On Hold') {
        statusBadgeClass = 'status-on-hold';
        statusIcon = '—';
      }

      let priorityClass = 'preview-badge-med';
      if (proj.priority === 'High') priorityClass = 'preview-badge-high';
      else if (proj.priority === 'Low') priorityClass = '';

      tbodyHtml += `
        <tr data-project-id="${escapeHtml(proj.id)}">
          <td>
            <div class="project-name-cell">
              <button type="button" class="project-name-link" data-open-project="${escapeHtml(proj.id)}" aria-label="View specifications for ${escapeHtml(proj.name)}">
                ${escapeHtml(proj.name)}
              </button>
              <span class="project-id-sub">${escapeHtml(proj.id)}</span>
            </div>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-secondary);">
              ${escapeHtml(proj.category)}
            </span>
          </td>
          <td>
            <span style="font-weight: 500;">${escapeHtml(proj.owner)}</span>
          </td>
          <td>
            <span class="status-badge ${statusBadgeClass}">
              <span aria-hidden="true">${statusIcon}</span> ${escapeHtml(proj.status)}
            </span>
          </td>
          <td>
            <div class="table-progress-cell">
              <div class="table-progress-bar" role="progressbar" aria-valuenow="${proj.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(proj.name)} progress: ${proj.progress}%">
                <div class="preview-progress-fill" style="width: ${proj.progress}%;"></div>
              </div>
              <span style="font-family: var(--font-mono); font-size: var(--text-xs); min-width: 32px;">${proj.progress}%</span>
            </div>
          </td>
          <td>
            <span class="preview-badge ${priorityClass}">${escapeHtml(proj.priority)}</span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-secondary);">
              ${escapeHtml(proj.deadline)}
            </span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted);">
              ${proj.teamSize} ${proj.teamSize === 1 ? 'eng' : 'engs'}
            </span>
          </td>
          <td>
            <button type="button" class="btn btn-secondary" data-open-project="${escapeHtml(proj.id)}" style="padding: 2px 8px; font-size: 11px; min-height: 32px;" aria-label="Inspect ${escapeHtml(proj.name)}">
              Inspect
            </button>
          </td>
        </tr>
      `;
    });

    DOM.tableBody.innerHTML = tbodyHtml;
  }

  function updateTableHeadersSortState() {
    if (!DOM.table) return;
    const headers = DOM.table.querySelectorAll('th.sortable');
    headers.forEach((th) => {
      const key = th.getAttribute('data-sort-key');
      const indicator = th.querySelector('.sort-indicator');

      if (key === state.sort.key) {
        th.setAttribute('aria-sort', state.sort.direction === 'asc' ? 'ascending' : 'descending');
        if (indicator) {
          indicator.textContent = state.sort.direction === 'asc' ? '▲' : '▼';
        }
      } else {
        th.setAttribute('aria-sort', 'none');
        if (indicator) {
          indicator.textContent = '↕';
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     9. Team Section Rendering
     -------------------------------------------------------------------------- */
  function renderTeamSection() {
    if (!DOM.teamGrid) return;

    if (state.team.length === 0) {
      DOM.teamGrid.innerHTML = '<p style="color: var(--color-text-muted);">No team member profiles allocated.</p>';
      return;
    }

    let html = '';
    state.team.forEach((member) => {
      html += `
        <article class="team-card">
          <div class="team-card-top">
            <div class="team-avatar-lg" aria-hidden="true">${escapeHtml(member.initials)}</div>
            <div>
              <h3 class="team-info-name">${escapeHtml(member.name)}</h3>
              <p class="team-info-role">${escapeHtml(member.role)}</p>
            </div>
          </div>
          <div class="team-card-meta">
            <div>
              <span style="color: var(--color-text-muted);">Assigned Project:</span>
              <span style="color: var(--color-text-primary); font-weight: 500;">${escapeHtml(member.project)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span class="status-badge ${member.status === 'Active' ? 'status-active' : 'status-on-hold'}" style="font-size: 11px;">
                <span aria-hidden="true">${member.status === 'Active' ? '●' : '—'}</span> ${escapeHtml(member.status)}
              </span>
              <span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted);">
                ${member.taskCount} active tasks
              </span>
            </div>
          </div>
        </article>
      `;
    });

    DOM.teamGrid.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     10. Activity Stream Rendering
     -------------------------------------------------------------------------- */
  function renderActivityFeed() {
    if (!DOM.activityFeed) return;

    if (state.activity.length === 0) {
      DOM.activityFeed.innerHTML = '<p style="color: var(--color-text-muted);">No recent activity logs recorded.</p>';
      return;
    }

    let html = '';
    state.activity.forEach((act) => {
      let formattedTime = act.timestamp;
      try {
        const d = new Date(act.timestamp);
        formattedTime = `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } catch (e) {
        // Fallback to raw string
      }

      html += `
        <article class="activity-item">
          <span class="activity-dot" aria-hidden="true"></span>
          <div class="activity-content">
            <span class="activity-user">${escapeHtml(act.user)}</span>
            <span class="activity-action">${escapeHtml(act.action)}</span>
            <span style="font-family: var(--font-mono); color: var(--color-accent); font-size: 11px;">[${escapeHtml(act.target)}]</span>
            <time class="activity-time" datetime="${escapeHtml(act.timestamp)}">${escapeHtml(formattedTime)}</time>
          </div>
        </article>
      `;
    });

    DOM.activityFeed.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     11. Project Details Modal (W3C Dialog Pattern & Focus Trap)
     -------------------------------------------------------------------------- */
  function openProjectModal(projectId, triggerBtn) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project || !DOM.modal) return;

    activeModalTrigger = triggerBtn || document.activeElement;

    // Populate modal fields
    const titleEl = document.getElementById('modal-field-title');
    const statusEl = document.getElementById('modal-field-status');
    const priorityEl = document.getElementById('modal-field-priority');
    const idEl = document.getElementById('modal-field-id');
    const catEl = document.getElementById('modal-field-category');
    const descEl = document.getElementById('modal-field-desc');
    const progNumEl = document.getElementById('modal-field-progress-num');
    const progFillEl = document.getElementById('modal-field-progress-fill');
    const progBarEl = document.getElementById('modal-field-progress-bar');
    const ownerEl = document.getElementById('modal-field-owner');
    const deadEl = document.getElementById('modal-field-deadline');
    const teamEl = document.getElementById('modal-field-teamsize');
    const healthEl = document.getElementById('modal-field-health');
    const taskListEl = document.getElementById('modal-task-list');

    if (titleEl) titleEl.textContent = project.name;
    if (idEl) idEl.textContent = `ID: ${project.id}`;
    if (catEl) catEl.textContent = project.category;
    if (descEl) descEl.textContent = project.description || 'No detailed architectural notes attached to this initiative.';
    if (progNumEl) progNumEl.textContent = `${project.progress}%`;
    if (progFillEl) progFillEl.style.width = `${project.progress}%`;
    if (progBarEl) progBarEl.setAttribute('aria-valuenow', project.progress);

    if (ownerEl) ownerEl.textContent = project.owner;
    if (deadEl) deadEl.textContent = project.deadline;
    if (teamEl) teamEl.textContent = `${project.teamSize} Allocated Engineers`;

    // Status badge formatting
    let statusClass = 'status-active';
    let statusGlyph = '●';
    if (project.status === 'Completed') {
      statusClass = 'status-completed';
      statusGlyph = '✓';
    } else if (project.status === 'At Risk') {
      statusClass = 'status-at-risk';
      statusGlyph = '!';
    } else if (project.status === 'On Hold') {
      statusClass = 'status-on-hold';
      statusGlyph = '—';
    }

    if (statusEl) {
      statusEl.className = `status-badge ${statusClass}`;
      statusEl.innerHTML = `<span aria-hidden="true">${statusGlyph}</span> ${escapeHtml(project.status)}`;
    }

    if (priorityEl) {
      priorityEl.className = `preview-badge ${project.priority === 'High' ? 'preview-badge-high' : project.priority === 'Low' ? '' : 'preview-badge-med'}`;
      priorityEl.textContent = `${project.priority} Priority`;
    }

    if (healthEl) {
      if (project.status === 'At Risk') {
        healthEl.textContent = 'Degraded (Review Required)';
        healthEl.style.color = 'var(--status-at-risk)';
      } else if (project.status === 'Completed') {
        healthEl.textContent = '100% Deployed & Verified';
        healthEl.style.color = 'var(--status-completed)';
      } else {
        healthEl.textContent = 'Nominal (On Schedule)';
        healthEl.style.color = 'var(--status-active)';
      }
    }

    // Populate associated tasks for this project
    const relatedTasks = state.tasks.filter((t) => t.projectId === project.id);
    if (taskListEl) {
      if (relatedTasks.length === 0) {
        taskListEl.innerHTML = '<p style="color: var(--color-text-muted); font-size: 12px;">No individual tasks mapped directly to this milestone.</p>';
      } else {
        let taskHtml = '';
        relatedTasks.forEach((t) => {
          let taskBadgeClass = 'status-active';
          let taskGlyph = '●';
          if (t.status === 'Completed') {
            taskBadgeClass = 'status-completed';
            taskGlyph = '✓';
          } else if (t.status === 'Pending') {
            taskBadgeClass = 'status-on-hold';
            taskGlyph = '—';
          }

          taskHtml += `
            <div class="modal-task-item">
              <div>
                <span style="font-weight: 500; color: var(--color-text-primary);">${escapeHtml(t.title)}</span>
                <span style="display: block; color: var(--color-text-muted); font-family: var(--font-mono); font-size: 11px;">Assignee: ${escapeHtml(t.assignee)}</span>
              </div>
              <span class="status-badge ${taskBadgeClass}" style="font-size: 10px;">
                <span aria-hidden="true">${taskGlyph}</span> ${escapeHtml(t.status)}
              </span>
            </div>
          `;
        });
        taskListEl.innerHTML = taskHtml;
      }
    }

    // Show modal and trap focus
    DOM.modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    const focusable = getFocusableElements(DOM.modalContainer);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  function closeProjectModal() {
    if (!DOM.modal || DOM.modal.hasAttribute('hidden')) return;

    DOM.modal.setAttribute('hidden', '');
    document.body.style.overflow = '';

    if (activeModalTrigger && typeof activeModalTrigger.focus === 'function') {
      activeModalTrigger.focus();
    }
    activeModalTrigger = null;
  }

  function getFocusableElements(element) {
    if (!element) return [];
    return Array.from(
      element.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  /* --------------------------------------------------------------------------
     12. Global Event Delegation
     -------------------------------------------------------------------------- */
  function attachEventDelegation() {
    // Refresh control
    if (DOM.refreshBtn) {
      DOM.refreshBtn.addEventListener('click', () => fetchWorkspaceData(true));
    }
    if (DOM.retryBtn) {
      DOM.retryBtn.addEventListener('click', () => fetchWorkspaceData(false));
    }

    // Search input (debounced or real-time)
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', (e) => {
        state.searchTerm = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Multi-filters
    if (DOM.filterStatus) {
      DOM.filterStatus.addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        applyFiltersAndSort();
      });
    }
    if (DOM.filterPriority) {
      DOM.filterPriority.addEventListener('change', (e) => {
        state.filters.priority = e.target.value;
        applyFiltersAndSort();
      });
    }
    if (DOM.filterCategory) {
      DOM.filterCategory.addEventListener('change', (e) => {
        state.filters.category = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Reset filters
    function resetAllFilters() {
      state.searchTerm = '';
      state.filters.status = 'all';
      state.filters.priority = 'all';
      state.filters.category = 'all';

      if (DOM.searchInput) DOM.searchInput.value = '';
      if (DOM.filterStatus) DOM.filterStatus.value = 'all';
      if (DOM.filterPriority) DOM.filterPriority.value = 'all';
      if (DOM.filterCategory) DOM.filterCategory.value = 'all';

      applyFiltersAndSort();
      showToast('Filters reset to defaults', 'info');
    }

    if (DOM.resetFiltersBtn) {
      DOM.resetFiltersBtn.addEventListener('click', resetAllFilters);
    }
    if (DOM.emptyResetBtn) {
      DOM.emptyResetBtn.addEventListener('click', resetAllFilters);
    }

    // Table sorting delegation
    if (DOM.table) {
      DOM.table.addEventListener('click', (e) => {
        const th = e.target.closest('th.sortable');
        if (th) {
          const key = th.getAttribute('data-sort-key');
          if (state.sort.key === key) {
            state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
          } else {
            state.sort.key = key;
            state.sort.direction = 'asc';
          }
          applyFiltersAndSort();
        }
      });

      // Keyboard accessible sorting on Table Headers
      DOM.table.addEventListener('keydown', (e) => {
        const th = e.target.closest('th.sortable');
        if (th && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          const key = th.getAttribute('data-sort-key');
          if (state.sort.key === key) {
            state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
          } else {
            state.sort.key = key;
            state.sort.direction = 'asc';
          }
          applyFiltersAndSort();
        }
      });
    }

    // Delegated click for opening project modal
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-open-project]');
      if (openBtn) {
        e.preventDefault();
        const projectId = openBtn.getAttribute('data-open-project');
        openProjectModal(projectId, openBtn);
        return;
      }

      // Close modal
      const closeBtn = e.target.closest('[data-modal-close]');
      if (closeBtn && DOM.modal && DOM.modal.contains(closeBtn)) {
        e.preventDefault();
        closeProjectModal();
        return;
      }

      // Backdrop click
      if (e.target === DOM.modal) {
        closeProjectModal();
      }
    });

    // Keyboard handlers for modal dialog (Escape to close, Tab trapping)
    document.addEventListener('keydown', (e) => {
      if (!DOM.modal || DOM.modal.hasAttribute('hidden')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeProjectModal();
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
  }

  /* --------------------------------------------------------------------------
     13. Initialization Entrypoint
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    attachEventDelegation();
    fetchWorkspaceData(false);
  });
})();
