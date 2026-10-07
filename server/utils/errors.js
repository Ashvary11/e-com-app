export const throwError = (
  message,
  statusCode = 500,
  errors = null,
  code = null,
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors; // field errors: { email: ["Invalid"] }
  error.code = code; // optional machine code: "OTP_EXPIRED"
  throw error;
};

// throwError("User not found.", 404);
// throwError("Invalid OTP.", 400);
// throwError("Too many attempts.", 429);
// throwError("Invalid credentials.", 401, { email: ["Wrong email or password."] });
// throwError("OTP expired.", 400, null, "OTP_EXPIRED");
// throwError("Validation failed.", 400, { email: ["Invalid email"] });

export const handleError = (error, res) => {
  console.error("Error:", error.message);

  // --- Zod (from safeParse or direct ZodError) ---
  if (error.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: error.flatten().fieldErrors,
    });
  }

  // --- Mongo: duplicate key (E11000) ---
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `This ${field} is already in use.`,
      errors: { [field]: [`This ${field} is already taken.`] },
    });
  }

  // --- Mongo: invalid ObjectId ---
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format.",
      errors: null,
    });
  }

  // --- Mongo: schema validation ---
  if (error.name === "ValidationError" && error.errors) {
    const errors = {};
    for (const key in error.errors) {
      errors[key] = [error.errors[key].message];
    }
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  // --- JWT / auth errors ---
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
      errors: null,
    });
  }
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
      errors: null,
    });
  }

  // --- Own errors (thrown via throwError) ---
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors || null,
      ...(error.code && { code: error.code }),
    });
  }

  // --- Unknown / crash ---
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    errors: null,
  });
};
