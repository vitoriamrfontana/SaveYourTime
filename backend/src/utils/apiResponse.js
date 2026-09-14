/**
 * apiResponse - padroniza o formato de toda resposta de sucesso da API,
 * facilitando o consumo no front-end (mesma "forma" de objeto sempre).
 *
 * Formato: { success: true, data: <payload> }
 */
function apiResponse(res, statusCode, data) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

module.exports = apiResponse;