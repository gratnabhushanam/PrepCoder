const express = require('express');
const router = express.Router();
const { Feature, Testimonial } = require('../config/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes here are protected and require admin role
router.use(protect, adminOnly);

// --- FEATURES ---

// Get all features
router.get('/features', async (req, res) => {
  try {
    const features = await Feature.find().sort({ order: 1 });
    res.json(features);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching features' });
  }
});

// Create new feature
router.post('/features', async (req, res) => {
  try {
    const feature = await Feature.create(req.body);
    res.status(201).json(feature);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating feature' });
  }
});

// Update feature
router.put('/features/:id', async (req, res) => {
  try {
    const feature = await Feature.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!feature) return res.status(404).json({ message: 'Feature not found' });
    res.json(feature);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating feature' });
  }
});

// Delete feature
router.delete('/features/:id', async (req, res) => {
  try {
    const feature = await Feature.findByIdAndDelete(req.params.id);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });
    res.json({ message: 'Feature deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting feature' });
  }
});

// --- TESTIMONIALS ---

// Get all testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching testimonials' });
  }
});

// Create new testimonial
router.post('/testimonials', async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating testimonial' });
  }
});

// Update testimonial
router.put('/testimonials/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating testimonial' });
  }
});

// Delete testimonial
router.delete('/testimonials/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json({ message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting testimonial' });
  }
});

module.exports = router;
