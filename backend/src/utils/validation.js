export const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

export const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};
