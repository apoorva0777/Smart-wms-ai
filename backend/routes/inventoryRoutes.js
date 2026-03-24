import express from 'express';
import { getInventory, createInventory } from '../controllers/inventoryController.js';

const router = express.Router();

router.route('/').get(getInventory).post(createInventory);

export default router;
