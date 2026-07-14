// sendResponse is the single function used everywhere to send API responses.
// It ensures every response — success or not — has the same JSON shape.
//
// Success shape:  { success: true,  message: "...", data: {...} }
// Failure shape:  { success: false, message: "...", errors: [...] }
//
// Parameters:
//   res        - Express response object
//   statusCode - HTTP status code (200, 201, 400, 404, etc.)
//   success    - boolean
//   message    - human-readable string describing what happened
//   data       - payload for success responses (optional)

const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = { success, message };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

module.exports = sendResponse;
