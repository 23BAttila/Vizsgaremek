/**
 * ============================================================================
 * GAMEHUNT - ADMIN PANEL SCRIPT
 * ============================================================================
 */

// Admin state
let currentAdminLevel = null;
let allUsers = [];
let filteredUsers = [];

// DOM Elements
let adminModal, adminTableBody, closeAdminBtn;

// Filter state
let usernameFilter = "";
let emailFilter = "";

/*
-------------------Initialize admin modal----------------------
*/
function initAdminModal() {
  adminModal = document.getElementById("admin-modal");
  adminTableBody = document.getElementById("admin-table-body");
  closeAdminBtn = document.getElementById("close-admin-modal");

  if (closeAdminBtn) {
    closeAdminBtn.addEventListener("click", closeAdminModal);
  }

  if (adminModal) {
    adminModal.addEventListener("click", (e) => {
      if (e.target === adminModal) closeAdminModal();
    });
  }

  const modalContent = document.querySelector(".admin-modal-content");
  if (modalContent) {
    modalContent.style.resize = "both";
    modalContent.style.overflow = "auto";
  }
  setupFilterableHeaders();
}

function setupFilterableHeaders() {
  const usernameHeader = document.querySelector(".admin-table th:first-child");
  const emailHeader = document.querySelector(".admin-table th:nth-child(3)");

  if (usernameHeader) {
    usernameHeader.style.cursor = "pointer";
    usernameHeader.title = "Click to filter by username";
    usernameHeader.addEventListener("click", () => makeHeaderFilterable(usernameHeader, "username"));
  }

  if (emailHeader) {
    emailHeader.style.cursor = "pointer";
    emailHeader.title = "Click to filter by email";
    emailHeader.addEventListener("click", () => makeHeaderFilterable(emailHeader, "email"));
  }
}


function makeHeaderFilterable(header, field) {
  if (header.querySelector("input")) return;

  const originalText = header.textContent;
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "5px";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `Filter ${field}...`;
  input.style.width = "100%";
  input.style.padding = "4px 8px";
  input.style.background = "var(--theme-based-bg)";
  input.style.color = "var(--based-on-theme)";
  input.style.border = "1px solid var(--gamecard-border)";
  input.style.borderRadius = "4px";
  input.style.fontSize = "12px";
  if (field === "username") input.value = usernameFilter;
  else if (field === "email") input.value = emailFilter;

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "✕";
  clearBtn.style.background = "transparent";
  clearBtn.style.border = "none";
  clearBtn.style.color = "var(--based-on-theme)";
  clearBtn.style.cursor = "pointer";
  clearBtn.style.fontSize = "14px";
  clearBtn.style.padding = "0 4px";
  clearBtn.title = "Clear filter and restore header";

  clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (field === "username") usernameFilter = "";
    else if (field === "email") emailFilter = "";
    header.textContent = originalText;
    setupFilterableHeaders();
    applyFiltersAndRender();
  });

  input.addEventListener("input", (e) => {
    if (field === "username") usernameFilter = e.target.value.toLowerCase();
    else if (field === "email") emailFilter = e.target.value.toLowerCase();
    applyFiltersAndRender();
  });

  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(clearBtn);
  header.textContent = "";
  header.appendChild(wrapper);

  // Focus the input
  setTimeout(() => input.focus(), 10);
}

/**
 * Apply text filters to the user list
 */
function applyFiltersAndRender() {
  filteredUsers = allUsers.filter(user => {
    const usernameMatch = !usernameFilter || user.username.toLowerCase().includes(usernameFilter);
    const emailMatch = !emailFilter || (user.email && user.email.toLowerCase().includes(emailFilter));
    return usernameMatch && emailMatch;
  });
  renderAdminTable();
}

//------Check admin status of current user-------

async function checkAdminStatus() {
  const username = localStorage.getItem("currentUser");
  if (!username) return false;

  try {
    const response = await fetch(`/api/admin/level/${username}`);
    if (!response.ok) return false;
    const data = await response.json();
    currentAdminLevel = data.adminLevel;
    return data.isAdmin;
  } catch (err) {
    console.error("Admin check failed:", err);
    return false;
  }
}
//------------Opening admin modal----------------
async function openAdminModal() {
  if (!await checkAdminStatus()) {
    showToast("Access denied. Admins only.", "error");
    return;
  }

  await loadUsers();
  adminModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

//----------Close admin modal-----------------
function closeAdminModal() {
  adminModal.classList.remove("active");
  document.body.style.overflow = "auto";
  // Reset filters when closing
  usernameFilter = "";
  emailFilter = "";
  // Restoring headers
  const usernameHeader = document.querySelector(".admin-table th:first-child");
  const emailHeader = document.querySelector(".admin-table th:nth-child(3)");
  if (usernameHeader && !usernameHeader.querySelector("input")) {
  } else {
    if (usernameHeader) usernameHeader.textContent = "Username";
    if (emailHeader) emailHeader.textContent = "Email";
    setupFilterableHeaders();
  }
}
//Loading all users
async function loadUsers() {
  try {
    const response = await fetch("/api/admin/users");
    if (!response.ok) throw new Error("Failed to load users");
    allUsers = await response.json();
    filteredUsers = [...allUsers];
    renderAdminTable();
  } catch (err) {
    console.error(err);
    adminTableBody.innerHTML = `<tr><td colspan="5" style="color: red;">Failed to load users</td></tr>`;
  }
}

//----------Render user table with action buttons--------
function renderAdminTable() {
  const currentUser = localStorage.getItem("currentUser");
  adminTableBody.innerHTML = "";

  if (filteredUsers.length === 0) {
    adminTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color: var(--text-gray);">No users match filter</td></tr>`;
    return;
  }

  filteredUsers.forEach(user => {
    const row = document.createElement("tr");

    // Usernames
    const nameCell = document.createElement("td");
    nameCell.textContent = user.username;
    if (user.username === currentUser) {
      nameCell.style.fontWeight = "bold";
    }
    row.appendChild(nameCell);

    // Roles
    const roleCell = document.createElement("td");
    roleCell.textContent = user.isAdmin ? `Admin Lvl ${user.adminLevel}` : "User";
    row.appendChild(roleCell);

    // Emails
    const emailCell = document.createElement("td");
    emailCell.textContent = user.email || "—";
    row.appendChild(emailCell);

    // Joined/TimeStamps
    const joinedCell = document.createElement("td");
    joinedCell.textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—";
    row.appendChild(joinedCell);

    // Actions
    const actionsCell = document.createElement("td");
    actionsCell.style.display = "flex";
    actionsCell.style.gap = "8px";
    actionsCell.style.justifyContent = "center";

    const isSelf = user.username === currentUser;
    const canManage = !isSelf && canManageUser(user);

    // +a / -a (toggle admin)
    if (canAddAdmin() && canManage) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "admin-action-btn";
      toggleBtn.textContent = user.isAdmin ? "−a" : "+a";
      toggleBtn.title = user.isAdmin ? "Remove admin" : "Make admin";
      toggleBtn.addEventListener("click", () => toggleAdmin(user));
      actionsCell.appendChild(toggleBtn);
    }

    // "C" (Choose) button for level adjustment
    if (user.isAdmin && canManage && canAdjustLevel(user)) {
      const chooseBtn = document.createElement("button");
      chooseBtn.className = "admin-action-btn";
      chooseBtn.textContent = "c";
      chooseBtn.title = "Change admin level";
      chooseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showLevelMenu(chooseBtn, user);
      });
      actionsCell.appendChild(chooseBtn);
    }

    // Rename (m) - only level 0
    if (canModifyName() && canManage) {
      const renameBtn = document.createElement("button");
      renameBtn.className = "admin-action-btn";
      renameBtn.textContent = "m";
      renameBtn.title = "Modify username";
      renameBtn.addEventListener("click", () => modifyUsername(user));
      actionsCell.appendChild(renameBtn);
    }

    // Delete (d)
    if (canDelete() && canManage) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "admin-action-btn danger";
      deleteBtn.textContent = "d";
      deleteBtn.title = "Delete user";
      deleteBtn.addEventListener("click", () => deleteUser(user));
      actionsCell.appendChild(deleteBtn);
    }

    row.appendChild(actionsCell);
    adminTableBody.appendChild(row);
  });
}


//Show floating menu for promote/demote options

function showLevelMenu(anchorButton, user) {
  const existingMenu = document.querySelector(".level-menu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.className = "level-menu";
  menu.style.position = "absolute";
  menu.style.backgroundColor = "var(--panel-bg)";
  menu.style.border = "1px solid var(--gamecard-border)";
  menu.style.borderRadius = "8px";
  menu.style.padding = "5px";
  menu.style.zIndex = "10000";
  menu.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

  const rect = anchorButton.getBoundingClientRect();
  menu.style.left = rect.left + "px";
  menu.style.top = (rect.bottom + 5) + "px";

  if (user.adminLevel > 0) {
    const promoteBtn = document.createElement("button");
    promoteBtn.textContent = "Promote";
    promoteBtn.style.display = "block";
    promoteBtn.style.width = "100%";
    promoteBtn.style.padding = "6px 12px";
    promoteBtn.style.background = "transparent";
    promoteBtn.style.border = "none";
    promoteBtn.style.color = "var(--based-on-theme)";
    promoteBtn.style.cursor = "pointer";
    promoteBtn.style.textAlign = "left";
    promoteBtn.addEventListener("mouseenter", () => promoteBtn.style.background = "rgba(255,255,255,0.1)");
    promoteBtn.addEventListener("mouseleave", () => promoteBtn.style.background = "transparent");
    promoteBtn.addEventListener("click", () => {
      changeAdminLevel(user, -1);
      menu.remove();
    });
    menu.appendChild(promoteBtn);
  }

  if (user.adminLevel < 3 && user.adminLevel < currentAdminLevel) {
    const demoteBtn = document.createElement("button");
    demoteBtn.textContent = "Demote";
    demoteBtn.style.display = "block";
    demoteBtn.style.width = "100%";
    demoteBtn.style.padding = "6px 12px";
    demoteBtn.style.background = "transparent";
    demoteBtn.style.border = "none";
    demoteBtn.style.color = "var(--based-on-theme)";
    demoteBtn.style.cursor = "pointer";
    demoteBtn.style.textAlign = "left";
    demoteBtn.addEventListener("mouseenter", () => demoteBtn.style.background = "rgba(255,255,255,0.1)");
    demoteBtn.addEventListener("mouseleave", () => demoteBtn.style.background = "transparent");
    demoteBtn.addEventListener("click", () => {
      changeAdminLevel(user, 1);
      menu.remove();
    });
    menu.appendChild(demoteBtn);
  }

  const setLevelBtn = document.createElement("button");
  setLevelBtn.textContent = "Set Level...";
  setLevelBtn.style.display = "block";
  setLevelBtn.style.width = "100%";
  setLevelBtn.style.padding = "6px 12px";
  setLevelBtn.style.background = "transparent";
  setLevelBtn.style.border = "none";
  setLevelBtn.style.color = "var(--based-on-theme)";
  setLevelBtn.style.cursor = "pointer";
  setLevelBtn.style.textAlign = "left";
  setLevelBtn.addEventListener("mouseenter", () => setLevelBtn.style.background = "rgba(255,255,255,0.1)");
  setLevelBtn.addEventListener("mouseleave", () => setLevelBtn.style.background = "transparent");
  setLevelBtn.addEventListener("click", async () => {
    const level = await promptForLevel("Set new admin level:", user.adminLevel);
    if (level !== null) {
      await updateAdminStatus(user.username, true, level);
      await loadUsers();
    }
    menu.remove();
  });
  menu.appendChild(setLevelBtn);

  document.body.appendChild(menu);

  const closeHandler = (e) => {
    if (!menu.contains(e.target) && e.target !== anchorButton) {
      menu.remove();
      document.removeEventListener("click", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", closeHandler), 10);
}

// --- Permission Helpers ---

function canAddAdmin() {
  return currentAdminLevel <= 1;
}

function canModifyName() {
  return currentAdminLevel === 0;
}

function canDelete() {
  return currentAdminLevel !== null;
}

function canManageUser(targetUser) {
  if (targetUser.username === localStorage.getItem("currentUser")) return false;
  if (!targetUser.isAdmin) return true;
  return currentAdminLevel < targetUser.adminLevel;
}

function canAdjustLevel(user) {
  return canManageUser(user);
}

// --- Admin Actions ---

async function toggleAdmin(user) {
  if (user.isAdmin) {
    if (!confirm(`Remove admin privileges from ${user.username}?`)) return;
    await updateAdminStatus(user.username, false, null);
  } else {
    const level = await promptForLevel("Select admin level for new admin:", 2);
    if (level === null) return;
    await updateAdminStatus(user.username, true, level);
  }
  await loadUsers();
}

async function changeAdminLevel(user, delta) {
  const newLevel = user.adminLevel + delta;
  if (newLevel < 0) return showToast("Cannot promote beyond level 0", "error");
  if (newLevel > 3) return showToast("Cannot demote below level 3", "error");
  
  if (currentAdminLevel !== 0 && newLevel <= currentAdminLevel) {
    return showToast("You cannot assign a level higher than or equal to your own", "error");
  }

  if (!confirm(`Change ${user.username}'s admin level from ${user.adminLevel} to ${newLevel}?`)) return;
  
  await updateAdminStatus(user.username, true, newLevel);
  await loadUsers();
}

function promptForLevel(message, defaultLevel) {
  return new Promise((resolve) => {
    const minLevel = (currentAdminLevel === 0) ? 0 : currentAdminLevel + 1;
    const maxLevel = 3;
    if (minLevel > maxLevel) {
      showToast("You at your level cannot make anyone admin", "error");
      return resolve(null);
    }

    const options = [];
    for (let i = minLevel; i <= maxLevel; i++) {
      options.push(`Level ${i}`);
    }

    const defaultStr = `Level ${defaultLevel}`;
    const levelStr = prompt(`${message}\nAvailable: ${options.join(", ")}`, defaultStr);
    if (!levelStr) return resolve(null);

    const match = levelStr.match(/Level (\d+)/i);
    if (!match) {
      showToast("Invalid format. Use 'Level {numbers}' exactly", "error");
      return resolve(null);
    }
    const level = parseInt(match[1]);
    if (level < minLevel || level > maxLevel) {
      showToast(`Level must be between ${minLevel} and ${maxLevel}`, "error");
      return resolve(null);
    }
    resolve(level);
  });
}

async function updateAdminStatus(username, isAdmin, adminLevel) {
  try {
    const response = await fetch("/api/admin/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        isAdmin,
        adminLevel,
        requestedBy: localStorage.getItem("currentUser")
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to update");
    }

    showToast(`Updated ${username}`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function modifyUsername(user) {
  const newName = prompt("Enter new username:", user.username);
  if (!newName || newName === user.username) return;

  try {
    const response = await fetch("/api/admin/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldUsername: user.username,
        newUsername: newName,
        requestedBy: localStorage.getItem("currentUser")
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to rename");
    }

    if (user.username === localStorage.getItem("currentUser")) {
      localStorage.setItem("currentUser", newName);
    }

    showToast(`Username changed to ${newName}`, "success");
    await loadUsers();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteUser(user) {
  if (!confirm(`Permanently delete ${user.username}?`)) return;

  try {
    const response = await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        requestedBy: localStorage.getItem("currentUser")
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to delete");
    }

    showToast(`${user.username} deleted.`, "success");
    await loadUsers();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  initAdminModal();

  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    try {
      const response = await fetch(`/api/admin/level/${currentUser}`);
      if (response.ok) {
        const data = await response.json();
        if (data.isAdmin) {
          currentAdminLevel = data.adminLevel;
          if (typeof addAdminPanelButton === "function") {
            addAdminPanelButton(data.adminLevel);
          }
        }
      }
    } catch (err) {
      console.error("Admin check failed", err);
    }
  }
});
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;