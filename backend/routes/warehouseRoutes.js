import express from 'express';
import { getWarehouses, createWarehouse } from '../controllers/warehouseController.js';

const router = express.Router();

router.route('/').get(getWarehouses).post(createWarehouse);

export default router;
