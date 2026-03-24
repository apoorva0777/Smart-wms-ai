import Warehouse from '../models/Warehouse.js';

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({});
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWarehouse = async (req, res) => {
  try {
    const { name, city, state, pincodes, isFallback } = req.body;
    const warehouse = new Warehouse({ name, city, state, pincodes, isFallback });
    const createdWarehouse = await warehouse.save();
    res.status(201).json(createdWarehouse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
