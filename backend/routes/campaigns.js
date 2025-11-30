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
      // Return the UUID for the frontend and smart contract integration.
      dbId: metadata.id || null,
      dbUuid: metadata.uuid,
      data: metadata
    });
  } catch (error) {
    console.error('Error creating initial campaign record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update campaign with blockchain ID after creation (accepts UUID path param)
router.patch('/:dbUuid/link', async (req, res) => {
  try {
    const { dbUuid } = req.params;
    const { campaignId } = req.body;

    if (!dbUuid || typeof dbUuid !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid dbUuid' });
    }

    // Find metadata by UUID
    const metadata = await CampaignMetadata.findOne({ where: { uuid: dbUuid } });
    if (!metadata) {
      return res.status(404).json({ success: false, error: 'Campaign record not found' });
    }

    // Validate campaignId
    const parsedId = Number.isFinite(Number(campaignId)) ? parseInt(campaignId) : null;
    if (parsedId === null || Number.isNaN(parsedId) || parsedId < 0) {
      return res.status(400).json({ success: false, error: 'Invalid campaignId' });
    }

    // Ensure no other metadata record is already linked to this blockchain campaignId
    const existing = await CampaignMetadata.findOne({ where: { campaignId: parsedId } });
    if (existing && existing.uuid !== metadata.uuid) {
      const force = req.body.force === true || req.query.force === 'true';

      if (!force) {
        return res.status(400).json({
          success: false,
          error: `campaignId ${parsedId} is already linked to another record (dbUuid=${existing.uuid}). To override, call again with { force: true }`,
          existingDbUuid: existing.uuid
        });
      }

      // Reassign in a transaction
      const sequelize = require('../config/sequelize');
      await sequelize.transaction(async (t) => {
        existing.campaignId = null;
        await existing.save({ transaction: t });

        metadata.campaignId = parsedId;
        await metadata.save({ transaction: t });
      });
    } else {
      metadata.campaignId = parsedId;
      await metadata.save();
    }

    res.json({ success: true, message: 'Campaign linked to blockchain', data: metadata });
  } catch (error) {
    console.error('Error linking campaign:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: resolve identifier which may be numeric campaignId or a UUID (dbUuid)
async function findMetadataByIdentifier(identifier) {
  if (!identifier) return null;
  // If it looks like a numeric id (all digits), treat as campaignId
  if (/^\d+$/.test(identifier)) {
    return await CampaignMetadata.findOne({ where: { campaignId: parseInt(identifier) } });
  }

  // Otherwise treat as db UUID
  return await CampaignMetadata.findOne({ where: { uuid: identifier } });
}

// Create or update campaign metadata
router.post('/:campaignId', upload.single('image'), async (req, res) => {
  try {
    const { campaignId: identifier } = req.params;
    const { category, location, detailedDescription, websiteUrl, socialMedia } = req.body;

    const isNumeric = /^\d+$/.test(identifier);

    // If identifier is numeric we allow upsert by campaignId (existing behavior)
    if (isNumeric) {
      const metadata = {
        campaignId: parseInt(identifier),
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

      return res.json({
        success: true,
        message: created ? 'Campaign metadata created' : 'Campaign metadata updated',
        data: campaign
      });
    }

    // If identifier looks like a UUID, update the existing metadata record only
    const metadataRecord = await CampaignMetadata.findOne({ where: { uuid: identifier } });
    if (!metadataRecord) {
      return res.status(404).json({ success: false, error: 'Campaign metadata not found for provided UUID' });
    }

    // Update fields
    if (category) metadataRecord.category = category;
    if (location) metadataRecord.location = location;
    if (detailedDescription) metadataRecord.detailedDescription = detailedDescription;
    if (websiteUrl) metadataRecord.websiteUrl = websiteUrl;
    if (socialMedia) metadataRecord.socialMedia = socialMedia ? JSON.parse(socialMedia) : metadataRecord.socialMedia;
    if (req.file) metadataRecord.imageUrl = `/uploads/campaigns/${req.file.filename}`;

    await metadataRecord.save();

    return res.json({ success: true, message: 'Campaign metadata updated', data: metadataRecord });
  } catch (error) {
    console.error('Error saving campaign metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get campaign metadata
router.get('/:campaignId', async (req, res) => {
  try {
    const { campaignId: identifier } = req.params;
    const metadata = await findMetadataByIdentifier(identifier);

    if (!metadata) {
      return res.status(404).json({ success: false, error: 'Campaign metadata not found' });
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
    const { campaignId: identifier } = req.params;
    console.log(`📸 Gallery upload request for campaign ${identifier}`);
    console.log(`📸 Files received:`, req.files?.length || 0);

    const metadata = await findMetadataByIdentifier(identifier);

    if (!metadata) {
      console.error(`❌ Campaign ${identifier} not found in database`);
      return res.status(404).json({ success: false, error: 'Campaign not found' });
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

    res.json({ success: true, message: `${req.files.length} image(s) uploaded`, data: metadata });
  } catch (error) {
    console.error('❌ Error uploading gallery images:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete gallery image
router.delete('/:campaignId/gallery/:imageIndex', async (req, res) => {
  try {
    const { campaignId: identifier, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    const metadata = await findMetadataByIdentifier(identifier);

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

    res.json({ success: true, message: 'Gallery image deleted', data: metadata });
  } catch (error) {
    console.error('❌ Error deleting gallery image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add campaign update
router.post('/:campaignId/updates', async (req, res) => {
  try {
    const { campaignId: identifier } = req.params;
    const { title, content } = req.body;

    const metadata = await findMetadataByIdentifier(identifier);

    if (!metadata) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const updates = metadata.updates || [];
    updates.push({ title, content, timestamp: new Date() });

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
  // AI-generated fields (optional)
  if (typeof ai_summary !== 'undefined') offChainData.ai_summary = ai_summary;
  if (typeof ai_risk_assessment !== 'undefined') offChainData.ai_risk_assessment = ai_risk_assessment;

    // Find metadata by numeric id or uuid
    let metadata = await findMetadataByIdentifier(identifier);

    if (!metadata) {
      // If identifier is numeric, create new metadata with campaignId
      if (/^\d+$/.test(identifier)) {
        metadata = await CampaignMetadata.create({ campaignId: parseInt(identifier), ...offChainData });
      } else {
        return res.status(404).json({ success: false, error: 'Campaign metadata not found for provided UUID' });
      }
    } else {
      // Update existing record
      await metadata.update({ ...offChainData, updatedAt: new Date() });
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
