// server/routes/transactionRoutes.js
const express = require("express");
const router = express.Router();

// ✅ FIXED: Import the named export correctly
const { authMiddleware } = require("../middleware/authMiddleware");

const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

router.use(authMiddleware); 

router.get("/", getTransactions);
router.post("/", addTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
