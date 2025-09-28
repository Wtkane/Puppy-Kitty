const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  googleAccessToken: {
    type: String
  },
  googleRefreshToken: {
    type: String
  },
  primaryColor: {
    type: String,
    default: '#ff6b6b'
  },
  secondaryColor: {
    type: String,
    default: '#4ecdc4'
  },
  currentGroup: {
    type: String,
    default: 'personal' // 'personal' or ObjectId of group
  },
  joinedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
