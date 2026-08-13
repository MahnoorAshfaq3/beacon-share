// Central error handler. Keeps error responses consistent and makes sure
// unexpected errors never crash the process or leak stack traces to clients.
function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);

  if (err.name === "MulterError") {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Something went wrong on the server." : err.message,
  });
}

module.exports = errorHandler;
