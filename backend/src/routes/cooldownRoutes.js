/**
 * ROUTES - Trava de Compras por Impulso (Cooldown 48h)
 * Integrante 4 - Trava Cooldown 48h
 *
 * Só conecta endpoint -> controller. Nenhuma regra de negócio aqui.
 */

const express = require("express");
const router = express.Router();

const cooldownController = require("../controllers/cooldownController");

router.get("/", cooldownController.listItems);
router.get("/auditoria", cooldownController.getAuditoria);
router.get("/:id", cooldownController.getItem);

router.post("/", cooldownController.createItem);

router.patch("/:id/quiz", cooldownController.responderQuiz);

// Auditoria de desfecho: encerra a quarentena
router.patch("/:id/desisti", cooldownController.registrarDesistencia);
router.patch("/:id/comprei", cooldownController.registrarCompra);

module.exports = router;
