const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { CampaignMetadata } = require('../models');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/campaigns/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'campaign-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Create or update campaign metadata
router.post('/:campaignId', upload.single('image'), async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { category, location, detailedDescription, websiteUrl, socialMedia } = req.body;

    const metadata = {
      campaignId: parseInt(campaignId),
      category,
      location,
      detailedDescription,
      websiteUrl,
      socialMedia: socialMedia ? JSON.parse(socialMedia) : {}
    };

    if (req.file) {
      metadata.imageUrl = `/uploads/campaigns/${req.file.filename}`;
    }

    const [campaign, created] = await CampaignMetadata.upsert(metadata, {
      returning: true
    });

    res.json({
      success: true,
      message: created ? 'Campaign metadata created' : 'Campaign metadata updated',
      data: campaign
    });
  } catch (error) {
    console.error('Error saving campaign metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get campaign metadata
router.get('/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const metadata = await CampaignMetadata.findOne({
      where: { campaignId: parseInt(campaignId) }
    });

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Campaign metadata not found'
      });
    }

    res.json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error fetching campaign metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all campaign metadata
router.get('/', async (req, res) => {
  try {
    const metadata = await CampaignMetadata.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload gallery images (multiple)
router.post('/:campaignId/gallery', upload.array('images', 10), async (req, res) => {
  try {
    const { campaignId } = req.params;

    const metadata = await CampaignMetadata.findOne({
      where: { campaignId: parseInt(campaignId) }
    });

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const galleryImages = metadata.galleryImages || [];
    
    // Add new images to gallery
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        galleryImages.push(`/uploads/campaigns/${file.filename}`);
      });
    }

    metadata.galleryImages = galleryImages;
    await metadata.save();

    res.json({ 
      success: true, 
      message: `${req.files.length} image(s) uploaded`,
      data: metadata 
    });
  } catch (error) {
    console.error('Error uploading gallery images:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add campaign update
router.post('/:campaignId/updates', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { title, content } = req.body;

    const metadata = await CampaignMetadata.findOne({
      where: { campaignId: parseInt(campaignId) }
    });

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const updates = metadata.updates || [];
    updates.push({
      title,
      content,
      timestamp: new Date()
    });

    metadata.updates = updates;
    await metadata.save();

    res.json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error adding campaign update:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
