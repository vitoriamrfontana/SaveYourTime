/**
 * ROUTES - Detox de Assinaturas
 * Integrante 3 - Detox de Assinaturas
 *
 * Só conecta endpoint -> middleware de validação -> controller.
 * Nenhuma lógica de negócio ou validação "solta" aqui.
 */

const express = require("express");
const router = express.Router();

const subscriptionsController = require("../controllers/subscriptionsController");
const {
  validateCreateSubscription,
  validateIdParam,
} = require("../middlewares/validateSubscription");

router.get("/", subscriptionsController.listSubscriptions);
router.post("/", validateCreateSubscription, subscriptionsController.createSubscription);
router.patch("/:id/toggle", validateIdParam, subscriptionsController.toggleSubscription);

module.exports = router;