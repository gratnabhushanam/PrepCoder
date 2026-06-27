const express = require('express');
const router = express.Router();
const { getCompilerConfig, updateCompilerConfig } = require('../services/compilerConfig');

// @route   GET /api/compiler/admin/config
// @desc    Get current compiler configuration
router.get('/config', (req, res) => {
    try {
        const config = getCompilerConfig();
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/compiler/admin/config
// @desc    Update compiler configuration
router.post('/config', (req, res) => {
    try {
        const newConfig = req.body;
        const updatedConfig = updateCompilerConfig(newConfig);
        res.json({ success: true, message: 'Compiler configuration updated successfully', config: updatedConfig });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
