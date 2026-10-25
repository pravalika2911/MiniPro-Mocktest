const getClientOrigin = () => {
  if (!process.env.CLIENT_URL) return 'http://localhost:5173';

  try {
    return new URL(process.env.CLIENT_URL).origin;
  } catch {
    return process.env.CLIENT_URL;
  }
};

module.exports = getClientOrigin;
