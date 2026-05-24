export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { expectText?: boolean },
): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parse failures for text responses.
    }

    throw new Error(message);
  }

  if (init?.expectText) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}
