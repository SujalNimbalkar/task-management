import { API_CONFIG, getApiUrl } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;
const BASE_TASKS_PATH = "/tasks"; // set to "/tasks" for old, "" for new

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "An unknown error occurred",
    }));
    const error = new Error(errorData.error || "API request failed");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// Helper to try both /api/tasks and /api for GET requests
async function fetchWithFallback(url, options) {
  try {
    const res = await fetch(url, options);
    if (res.status === 404 && BASE_TASKS_PATH === "/tasks") {
      // fallback to /api
      const fallbackUrl = url.replace("/tasks", "");
      return handleResponse(await fetch(fallbackUrl, options));
    }
    return handleResponse(res);
  } catch (err) {
    if (BASE_TASKS_PATH === "/tasks") {
      // fallback to /api
      const fallbackUrl = url.replace("/tasks", "");
      return handleResponse(await fetch(fallbackUrl, options));
    }
    throw err;
  }
}

export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/users`);
  return handleResponse(response);
}

export async function fetchTasks(userId) {
  if (!userId) return [];
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}?userId=${userId}`;
  return fetchWithFallback(url);
}

export async function completeTask(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/complete`;
  return fetchWithFallback(url, { method: "POST" });
}

export async function updateTask(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/update`;
  return fetchWithFallback(url, { method: "POST" });
}

export async function submitTaskForm(taskId, formData) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/submit-form`;
  return fetchWithFallback(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
}

export async function fetchFormSubmissions(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/form-submissions`;
  return fetchWithFallback(url);
}

export async function triggerEvent(eventType, taskId, data = {}) {
  const url = `${API_BASE_URL}/trigger-event`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventType,
      taskId,
      data,
    }),
  });
  return handleResponse(response);
}

export async function fetchAllFormSubmissions(userId) {
  if (!userId) return [];
  const url = `${API_BASE_URL}/form-submissions?userId=${userId}`;
  return fetchWithFallback(url);
}

export async function approveDailyTask(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/approve`;
  return fetchWithFallback(url, { method: "POST" });
}

export async function rejectDailyTask(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/reject`;
  return fetchWithFallback(url, { method: "POST" });
}

export async function reassignDailyTask(taskId, newManagerId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/reassign`;
  return fetchWithFallback(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newManagerId }),
  });
}

export async function exportTaskToPDF(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/export-pdf`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("PDF export failed");
  }

  const blob = await response.blob();
  const url2 = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url2;
  a.download = `task_${taskId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url2);
  document.body.removeChild(a);
}

// New functions for user assignment and management
export async function assignTaskToUser(taskId, userId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}/assign-user`;
  return fetchWithFallback(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
}

export async function getAvailableUsersForRole(role) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/available-users/${role}`;
  return fetchWithFallback(url);
}

export async function createUser(userData) {
  const url = `${API_BASE_URL}/users`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
}

export async function updateUser(userId, userData) {
  const url = `${API_BASE_URL}/users/${userId}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
}

export async function deleteUser(userId) {
  const url = `${API_BASE_URL}/users/${userId}`;
  const response = await fetch(url, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function getUsersByRole(role) {
  const url = `${API_BASE_URL}/users/role/${role}`;
  return fetchWithFallback(url);
}

export async function deleteTask(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}`;
  return fetchWithFallback(url, { method: "DELETE" });
}
