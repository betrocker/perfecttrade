export const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  timeout = 10000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeout)
        ),
      ]);
      return result;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
};
