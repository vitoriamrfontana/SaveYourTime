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
  validateUpdateSubscription,
  validateStatusChange,
  validateUpcomingQuery,
  validateIdParam,
  validateUsageCheck,
} = require("../middlewares/validateSubscription");

router.get("/", subscriptionsController.listSubscriptions);
// Sprint 4: tela inteira numa chamada, taxonomia e próximas cobranças
router.get("/overview", subscriptionsController.getOverview);
router.get("/meta", subscriptionsController.getMeta);
router.get("/upcoming", validateUpcomingQuery, subscriptionsController.getProximasCobrancas);
router.get("/insights", subscriptionsController.getInsights);
router.get("/auditoria", subscriptionsController.getAuditoria);
router.get("/redundancies", subscriptionsController.detectarRedundancias);
router.post("/", validateCreateSubscription, subscriptionsController.createSubscription);
router.patch("/:id/toggle", validateIdParam, subscriptionsController.toggleSubscription);
// Sprint 4: status de verdade (ativa, teste grátis, pausada, cancelada)
router.patch("/:id/status", validateIdParam, validateStatusChange, subscriptionsController.alterarStatus);
router.post(
  "/:id/usage-check",
  validateIdParam,
  validateUsageCheck,
  subscriptionsController.calcularCustoUso
);
// Sprint 4: edição e exclusão
router.patch("/:id", validateIdParam, validateUpdateSubscription, subscriptionsController.updateSubscription);
router.delete("/:id", validateIdParam, subscriptionsController.deleteSubscription);

module.exports = router;
