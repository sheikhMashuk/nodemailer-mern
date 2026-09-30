// Address of our Express server.
// Locally it's localhost:5000. On Vercel, set VITE_API_URL to the backend's URL
// (e.g. https://my-backend.vercel.app). Vite bakes it in at build time.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Address of the auth routes
const AUTH_URL = `${API_URL}/api/auth`;

// Small helper: POST JSON to /api/auth/<path> and return the JSON answer.
// Throws an Error with the server's message if the request failed.
export async function authRequest(path, body) {
  const res = await fetch(`${AUTH_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  // fetch does not throw on 400/500, so we check res.ok ourselves
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}
