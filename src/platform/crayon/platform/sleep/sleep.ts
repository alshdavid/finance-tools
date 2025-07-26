export const exec = <T = any>(
  callback: () => any,
  duration: number = 0
): Promise<T> =>
  new Promise((res) =>
    setTimeout(() => {
      const val = callback();
      res(val);
    }, duration)
  );

export const duration = (duration: number = 0): Promise<void> =>
  new Promise<void>((res) => setTimeout(res, duration));
