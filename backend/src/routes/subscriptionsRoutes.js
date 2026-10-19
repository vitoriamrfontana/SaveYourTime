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
  validateUsageCheck,
} = require("../middlewares/validateSubscription");

router.get("/", subscriptionsController.listSubscriptions);
router.get("/insights", subscriptionsController.getInsights);
router.get("/auditoria", subscriptionsController.getAuditoria);
router.get("/redundancies", subscriptionsController.detectarRedundancias);
router.post("/", validateCreateSubscription, subscriptionsController.createSubscription);
router.patch("/:id/toggle", validateIdParam, subscriptionsController.toggleSubscription);
router.post(
  "/:id/usage-check",
  validateIdParam,
  validateUsageCheck,
  subscriptionsController.calcularCustoUso
);
module.exports = router;