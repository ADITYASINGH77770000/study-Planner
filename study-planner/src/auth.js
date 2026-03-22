// ─────────────────────────────────────────────
//  Auth — client-side localStorage auth
//  No backend needed; data stays on this device
// ─────────────────────────────────────────────

export function getUsers() {
  try { return JSON.parse(localStorage.getItem("sp_users") || "{}"); } catch { return {}; }
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("sp_currentUser") || "null"); } catch { return null; }
}

export function signUp(username, password) {
  const name = username.trim();
  if (!name || name.length < 2)   throw new Error("Username must be at least 2 characters.");
  if (!password || password.length < 4) throw new Error("Password must be at least 4 characters.");
  const users = getUsers();
  const key   = name.toLowerCase();
  if (users[key]) throw new Error("That username is taken — try another!");
  users[key] = { username: name, password, isNew: true, createdAt: Date.now() };
  localStorage.setItem("sp_users", JSON.stringify(users));
  const user = { username: name, isNew: true };
  localStorage.setItem("sp_currentUser", JSON.stringify(user));
  return user;
}

export function signIn(username, password) {
  const users = getUsers();
  const key   = username.toLowerCase().trim();
  const user  = users[key];
  if (!user)                throw new Error("No account found — check your username or sign up.");
  if (user.password !== password) throw new Error("Wrong password. Try again!");
  // Mark not new anymore
  users[key].isNew = false;
  localStorage.setItem("sp_users", JSON.stringify(users));
  const currentUser = { username: user.username, isNew: user.isNew };
  localStorage.setItem("sp_currentUser", JSON.stringify(currentUser));
  return currentUser;
}

export function signOut() {
  localStorage.removeItem("sp_currentUser");
}