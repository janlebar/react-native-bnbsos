export async function auth() {
  // Simulate a signed-in user
  return new Promise((resolve) => {
    setTimeout(() => resolve({ user: "john@example.com" }), 1000);
  });
}
