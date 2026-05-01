const categoryModel = require('../models/categoryModel');

const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getCategoriesByUser(req.user.id);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCategory = async (req, res) => {
  try {
    const category = await categoryModel.getCategoryById(req.params.id, req.user.id);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const category = await categoryModel.createCategory(req.user.id, { name, type });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const category = await categoryModel.updateCategory(req.params.id, req.user.id, { name, type });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const forceDelete = req.query.force === 'true';
    const categoryId = req.params.id;
    const userId = req.user.id;

    const category = await categoryModel.getCategoryById(categoryId, userId);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    if (category.name === 'Uncategorized') return res.status(400).json({ success: false, error: 'Cannot delete Uncategorized category' });

    const transactionCount = await categoryModel.countTransactionsForCategory(categoryId);

    if (transactionCount > 0) {
      if (!forceDelete) {
        return res.status(400).json({ 
          success: false, 
          error: 'Category has associated transactions. Use ?force=true to delete and reassign to Uncategorized.' 
        });
      }

      // Reassign transactions to Uncategorized
      const uncategorized = await categoryModel.getUncategorizedCategory(userId, category.type);
      await categoryModel.reassignTransactions(categoryId, uncategorized.id);
    }

    await categoryModel.deleteCategory(categoryId, userId);
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
