export async function getUsers() {
  const res = await fetch("https://693691f2f8dc350aff31551d.mockapi.io/api/v1/users");
  return res.json();
}