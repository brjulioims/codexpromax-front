export function mapUsuarios(data = []) {
  return data.map((user) => ({
    ...user,
    name: user.nombre,
    role: user.rolNombre,
    authProvider: user.authProvider || "local",
  }));
}

export function filterUsuarios(users = [], filters) {
  const normalizedQuery = filters.query.trim().toUpperCase();

  return users.filter((user) => {
    if (filters.role !== "Todos" && user.role !== filters.role) return false;
    if (filters.status !== "Todos" && user.status !== filters.status) return false;
    if (filters.authProvider !== "Todos" && user.authProvider !== filters.authProvider) return false;

    if (!normalizedQuery) return true;

    return (
      user.name.toUpperCase().includes(normalizedQuery) ||
      user.username.toUpperCase().includes(normalizedQuery)
    );
  });
}

export function buildUserOptions(users = []) {
  return [...users]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((user) => ({
      id: user.id,
      label: `${user.name} | ${user.username}`,
      queryValue: user.name,
    }));
}

export function filterUserOptions(options = [], query = "") {
  const normalized = query.trim().toUpperCase();
  if (!normalized) return [];

  return options.filter(
    (u) =>
      u.label.toUpperCase().includes(normalized) ||
      u.queryValue.toUpperCase().includes(normalized)
  );
}
