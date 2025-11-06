const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { UserProfile } = require('../models');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
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

// Create or update user profile
router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    const { walletAddress, username, bio, email, socialMedia } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const profileData = {
      walletAddress: walletAddress.toLowerCase(),
      username,
      bio,
      email,
      socialMedia: socialMedia ? JSON.parse(socialMedia) : {}
    };

    if (req.file) {
      profileData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const [profile, created] = await UserProfile.upsert(profileData, {
      returning: true
    });

    res.json({
      success: true,
      message: created ? 'Profile created' : 'Profile updated',
      data: profile
    });
  } catch (error) {
    console.error('Error saving user profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile by wallet address
router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const profile = await UserProfile.findOne({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
