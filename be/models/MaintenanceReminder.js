// models/MaintenanceReminder.js
const mongoose = require('mongoose');

const MaintenanceReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      description: 'Original order where product was purchased'
    },
    reminderType: {
      type: String,
      enum: ['maintenance', 'cleaning', 'replacement', 'usage_tip', 'accessory', 'other'],
      required: [true, 'Reminder type is required']
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Reminder message is required'],
      trim: true
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringInterval: {
      type: Number,
      description: 'Interval in days for recurring reminders'
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'read', 'completed', 'dismissed', 'failed'],
      default: 'scheduled'
    },
    sentAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    nextReminder: {
      type: Date,
      description: 'Next date for recurring reminders'
    },
    relatedProducts: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        relevance: {
          type: String,
          enum: ['accessory', 'replacement', 'upgrade', 'maintenance_item'],
          default: 'accessory'
        }
      }
    ],
    mediaUrls: [String],
    notificationChannel: {
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      default: 'email'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if reminder is due
MaintenanceReminderSchema.virtual('isDue').get(function() {
  const now = new Date();
  return this.status === 'scheduled' && this.scheduledDate <= now;
});

// Virtual for checking if reminder is overdue
MaintenanceReminderSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  
  return this.status === 'scheduled' && this.scheduledDate <= twoDaysAgo;
});

// Method to mark reminder as sent
MaintenanceReminderSchema.methods.markAsSent = async function() {
  this.status = 'sent';
  this.sentAt = new Date();
  
  // Schedule next reminder if recurring
  if (this.isRecurring && this.recurringInterval > 0) {
    const nextDate = new Date(this.scheduledDate);
    nextDate.setDate(nextDate.getDate() + this.recurringInterval);
    this.nextReminder = nextDate;
  }
  
  return this.save();
};

// Method to mark reminder as read
MaintenanceReminderSchema.methods.markAsRead = async function() {
  if (this.status === 'sent') {
    this.status = 'read';
    return this.save();
  }
  
  throw new Error('Cannot mark as read: reminder has not been sent');
};

// Method to mark reminder as completed
MaintenanceReminderSchema.methods.markAsCompleted = async function() {
  if (['sent', 'read'].includes(this.status)) {
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Create next reminder if recurring
    if (this.isRecurring && this.recurringInterval > 0 && this.nextReminder) {
      try {
        // Create a new reminder for next interval
        const newReminder = new this.constructor({
          userId: this.userId,
          productId: this.productId,
          orderId: this.orderId,
          reminderType: this.reminderType,
          title: this.title,
          message: this.message,
          scheduledDate: this.nextReminder,
          isRecurring: this.isRecurring,
          recurringInterval: this.recurringInterval,
          relatedProducts: this.relatedProducts,
          mediaUrls: this.mediaUrls,
          notificationChannel: this.notificationChannel
        });
        
        await newReminder.save();
      } catch (error) {
        console.error('Failed to create recurring reminder:', error);
      }
    }
    
    return this.save();
  }
  
  throw new Error('Cannot mark as completed: reminder has not been sent or read');
};

// Method to dismiss reminder
MaintenanceReminderSchema.methods.dismiss = async function() {
  this.status = 'dismissed';
  return this.save();
};

// Static method to get due reminders
MaintenanceReminderSchema.statics.getDueReminders = async function() {
  const now = new Date();
  
  return this.find({
    status: 'scheduled',
    scheduledDate: { $lte: now }
  }).populate('userId', 'email firstName lastName').populate('productId', 'name slug');
};

// Static method to create product maintenance schedule
MaintenanceReminderSchema.statics.createMaintenanceSchedule = async function(userId, productId, orderId) {
  try {
    // Get product details
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Get user details
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check for product maintenance metadata
    if (!product.metadata || !product.metadata.get('maintenance_schedule')) {
      // Default schedule based on product category
      const Category = mongoose.model('Category');
      const category = await Category.findById(product.categoryId);
      
      let schedule = [];
      
      if (category) {
        // Create schedule based on category
        switch (category.name.toLowerCase()) {
          case 'knives':
            schedule = [
              {
                type: 'maintenance',
                title: 'Mài dao',
                message: `Đã đến lúc mài dao ${product.name} của bạn để duy trì độ sắc bén tối ưu.`,
                interval: 90 // 3 tháng
              }
            ];
            break;
            
          case 'nồi':
          case 'chảo':
            schedule = [
              {
                type: 'cleaning',
                title: 'Vệ sinh nồi/chảo',
                message: `Nhắc nhở vệ sinh sâu cho ${product.name} của bạn để loại bỏ cặn bám và duy trì hiệu suất.`,
                interval: 30 // 1 tháng
              }
            ];
            break;
            
          case 'máy xay':
            schedule = [
              {
                type: 'maintenance',
                title: 'Kiểm tra lưỡi dao',
                message: `Kiểm tra lưỡi dao của ${product.name} và vệ sinh kỹ để đảm bảo hoạt động tốt.`,
                interval: 60 // 2 tháng
              }
            ];
            break;
            
          default:
            schedule = [
              {
                type: 'usage_tip',
                title: 'Mẹo sử dụng',
                message: `Đây là một số mẹo để sử dụng ${product.name} hiệu quả và kéo dài tuổi thọ sản phẩm.`,
                interval: 60 // 2 tháng
              }
            ];
        }
      }
      
      // Create reminders for the schedule
      const reminders = [];
      
      for (const item of schedule) {
        const now = new Date();
        const scheduledDate = new Date();
        scheduledDate.setDate(now.getDate() + item.interval);
        
        const reminder = await this.create({
          userId,
          productId,
          orderId,
          reminderType: item.type,
          title: item.title,
          message: item.message,
          scheduledDate,
          isRecurring: true,
          recurringInterval: item.interval
        });
        
        reminders.push(reminder);
      }
      
      return reminders;
    } else {
      // Use product-specific maintenance schedule
      const maintenanceSchedule = JSON.parse(product.metadata.get('maintenance_schedule'));
      const reminders = [];
      
      for (const item of maintenanceSchedule) {
        const now = new Date();
        const scheduledDate = new Date();
        scheduledDate.setDate(now.getDate() + item.interval);
        
        const reminder = await this.create({
          userId,
          productId,
          orderId,
          reminderType: item.type,
          title: item.title,
          message: item.message,
          scheduledDate,
          isRecurring: item.recurring !== false,
          recurringInterval: item.interval
        });
        
        reminders.push(reminder);
      }
      
      return reminders;
    }
  } catch (error) {
    throw new Error(`Failed to create maintenance schedule: ${error.message}`);
  }
};

// Indexes for faster lookups
MaintenanceReminderSchema.index({ userId: 1 });
MaintenanceReminderSchema.index({ productId: 1 });
MaintenanceReminderSchema.index({ status: 1, scheduledDate: 1 });
MaintenanceReminderSchema.index({ reminderType: 1 });

module.exports = mongoose.model('MaintenanceReminder', MaintenanceReminderSchema);
