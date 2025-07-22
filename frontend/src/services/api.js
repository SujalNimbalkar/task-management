const API_BASE_URL = "http://localhost:4000/api";

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

export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/users`);
  return handleResponse(response);
}

export async function fetchTasks(userId) {
  if (!userId) return [];
  const response = await fetch(`${API_BASE_URL}/tasks?userId=${userId}`);
  return handleResponse(response);
}

export async function completeTask(taskId) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
    method: "POST",
  });
  return handleResponse(response);
}

export async function updateTask(taskId) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/update`, {
    method: "POST",
  });
  return handleResponse(response);
}

export async function submitTaskForm(taskId, formData) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/submit-form`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  return handleResponse(response);
}
