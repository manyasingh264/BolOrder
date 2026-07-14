// validateRequest.middleware.js — runs a Zod schema against req.body.
//
// This is a middleware FACTORY — it takes a schema and RETURNS a middleware function.
// Usage in routes: router.post('/login', validateRequest(loginSchema), controller.login)
//
// If validation passes → next() is called, request continues to the controller.
// If validation fails  → next(error) is called with the ZodError.
//                        The errorHandler in app.js catches it and returns 400.

const validateRequest = (schema) => (req, res, next) => {
  try {
    // parse() throws a ZodError if the body doesn't match the schema.
    // It also strips unknown fields by default, keeping our data clean.
    schema.parse(req.body);
    next();
  } catch (error) {
    // Pass the ZodError to Express's centralized error handler
    next(error);
  }
};

module.exports = validateRequest;
