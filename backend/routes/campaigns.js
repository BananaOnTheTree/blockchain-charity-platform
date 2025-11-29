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

// Create initial campaign record (before blockchain) - returns DB ID
router.post('/init', async (req, res) => {
  try {
    const { category, location, detailedDescription, websiteUrl, socialMedia } = req.body;

    const metadata = await CampaignMetadata.create({
      category: category || null,
      location: location || null,
      detailedDescription: detailedDescription || null,
      websiteUrl: websiteUrl || null,
      socialMedia: socialMedia ? JSON.parse(socialMedia) : {},
      campaignId: null // Will be updated after blockchain creation
    });

    res.json({
      success: true,
      message: 'Campaign record created',
      dbId: metadata.id,
      data: metadata
    });
  } catch (error) {
    console.error('Error creating initial campaign record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update campaign with blockchain ID after creation
router.patch('/:dbId/link', async (req, res) => {
  try {
    const { dbId } = req.params;
    const { campaignId } = req.body;

    const metadata = await CampaignMetadata.findByPk(dbId);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Campaign record not found'
      });
    }

    // Validate campaignId
    const parsedId = Number.isFinite(Number(campaignId)) ? parseInt(campaignId) : null;
    if (parsedId === null || Number.isNaN(parsedId) || parsedId < 0) {
      return res.status(400).json({ success: false, error: 'Invalid campaignId' });
    }

    // Ensure no other metadata record is already linked to this blockchain campaignId
    const existing = await CampaignMetadata.findOne({ where: { campaignId: parsedId } });
    if (existing && existing.id !== metadata.id) {
      return res.status(400).json({
        success: false,
        error: `campaignId ${parsedId} is already linked to another record (dbId=${existing.id})`
      });
    }

    metadata.campaignId = parsedId;
    await metadata.save();

    res.json({
      success: true,
      message: 'Campaign linked to blockchain',
      data: metadata
    });
  } catch (error) {
    console.error('Error linking campaign:', error);
    res.status(500).json({ success: false, error: error.message });
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
    console.log(`📸 Gallery upload request for campaign ${campaignId}`);
    console.log(`📸 Files received:`, req.files?.length || 0);

    const metadata = await CampaignMetadata.findOne({
      where: { campaignId: parseInt(campaignId) }
    });

    if (!metadata) {
      console.error(`❌ Campaign ${campaignId} not found in database`);
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const galleryImages = metadata.galleryImages || [];
    console.log(`📸 Current gallery images:`, galleryImages.length);
    
    // Add new images to gallery
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const imagePath = `/uploads/campaigns/${file.filename}`;
        console.log(`📸 Adding image: ${imagePath}`);
        galleryImages.push(imagePath);
      });
    }

    // IMPORTANT: Sequelize doesn't detect changes to JSON arrays when mutated directly
    // We need to explicitly mark the field as changed or reassign it
    metadata.galleryImages = [...galleryImages]; // Create new array to trigger Sequelize change detection
    metadata.changed('galleryImages', true); // Explicitly mark as changed
    await metadata.save();
    console.log(`✅ Gallery updated. Total images: ${galleryImages.length}`);

    // Reload from database to ensure we return fresh data
    await metadata.reload();
    console.log(`📸 Reloaded gallery images:`, metadata.galleryImages);

    res.json({ 
      success: true, 
      message: `${req.files.length} image(s) uploaded`,
      data: metadata 
    });
  } catch (error) {
    console.error('❌ Error uploading gallery images:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete gallery image
router.delete('/:campaignId/gallery/:imageIndex', async (req, res) => {
  try {
    const { campaignId, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    const metadata = await CampaignMetadata.findOne({
      where: { campaignId: parseInt(campaignId) }
    });

    if (!metadata) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const galleryImages = metadata.galleryImages || [];
    
    if (index < 0 || index >= galleryImages.length) {
      return res.status(400).json({ success: false, error: 'Invalid image index' });
    }

    // Remove the image path from the array
    const removedImage = galleryImages.splice(index, 1)[0];
    
    // Update the database with the new array
    metadata.galleryImages = [...galleryImages];
    metadata.changed('galleryImages', true);
    await metadata.save();

    console.log(`🗑️ Deleted gallery image at index ${index}: ${removedImage}`);
    console.log(`📸 Remaining gallery images: ${galleryImages.length}`);

    // Optionally delete the physical file from filesystem
    if (removedImage) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', removedImage);
      
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn(`⚠️ Could not delete file ${filePath}:`, err.message);
        } else {
          console.log(`✅ Deleted file: ${filePath}`);
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Gallery image deleted',
      data: metadata 
    });
  } catch (error) {
    console.error('❌ Error deleting gallery image:', error);
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

// Edit campaign - only update OFF-CHAIN metadata
// Note: Title and description are updated on blockchain, not here
router.put('/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { 
      // Accept but ignore blockchain fields
      title, 
      description, 
      // Only update these off-chain fields
      category,
      tags,
      location,
      country,
      detailedDescription,
      story,
      impactStatement,
      websiteUrl,
      contactEmail,
      socialMedia,
      milestones,
      faqs,
      videoUrl
    } = req.body;

    // Only store off-chain data
    const offChainData = {};
    if (category) offChainData.category = category;
    if (tags) offChainData.tags = tags;
    if (location) offChainData.location = location;
    if (country) offChainData.country = country;
    if (detailedDescription) offChainData.detailedDescription = detailedDescription;
    if (story) offChainData.story = story;
    if (impactStatement) offChainData.impactStatement = impactStatement;
    if (websiteUrl) offChainData.websiteUrl = websiteUrl;
    if (contactEmail) offChainData.contactEmail = contactEmail;
    if (socialMedia) offChainData.socialMedia = socialMedia;
    if (milestones) offChainData.milestones = milestones;
    if (faqs) offChainData.faqs = faqs;
    if (videoUrl) offChainData.videoUrl = videoUrl;

    // Find or create metadata record
    let metadata = await CampaignMetadata.findOne({
      where: { campaignId: parseInt(campaignId) }
    });

    if (!metadata) {
      // Create new metadata record
      metadata = await CampaignMetadata.create({
        campaignId: parseInt(campaignId),
        ...offChainData
      });
    } else {
      // Update existing record
      await metadata.update({
        ...offChainData,
        updatedAt: new Date()
      });
    }

    res.json({ 
      success: true, 
      message: 'Campaign metadata updated (blockchain data ignored - use blockchain as source of truth)',
      data: metadata 
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
