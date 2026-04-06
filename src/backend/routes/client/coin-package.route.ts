import express from "express";
import {
  getAllCoinPackages,
  getOrderDetailById,
} from "../../models/coin-package.model";
const router = express.Router();

router.get("/", async (req, res) => {
  const coinPackages = await getAllCoinPackages();
  res.json({
    success: true,
    data: {
      coinPackages: coinPackages,
    },
  });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const coinPackage = await getOrderDetailById(parseInt(id));
  res.json({
    success: true,
    data: {
      coinPackage: coinPackage,
    },
  });
});

export default router;
