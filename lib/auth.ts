import { getToken } from "../utils/secureStore";

export const auth = async () => {
  const token = await getToken();
  return token ? { token } : null;
};

// export async function auth() {
//   // Simulate a signed-in user
//   return new Promise((resolve) => {
//     setTimeout(() => resolve({ user: "john@example.com" }), 1000);
//   });
// }
