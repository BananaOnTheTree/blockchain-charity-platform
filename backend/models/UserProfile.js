const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  walletAddress: {
    type: DataTypes.STRING(42),
    allowNull: false,
    comment: 'Ethereum wallet address'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  socialMedia: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['walletAddress']
    }
  ]
});

module.exports = UserProfile;
