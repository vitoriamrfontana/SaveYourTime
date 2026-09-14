/**
 * ApiError - erro customizado que carrega um status HTTP junto da mensagem.
 * Usado pelos controllers para sinalizar falhas de negócio (404, 400, etc.)
 * de forma consistente, sem espalhar res.status(...).json(...) por toda parte.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }

  static badRequest(message) {
    return new ApiError(400, message);
  }

  static notFound(message) {
    return new ApiError(404, message);
  }
}

module.exports = ApiError;