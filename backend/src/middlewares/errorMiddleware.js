const errorHandler = (err, req, res, next) => {
  
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid resource identifier" });
  }
  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ success: false, message: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate value entered for a unique field",
    });
  }
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token. Please sign in again." });
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : "Something went very wrong!",
    });
  }
};

export default errorHandler;
