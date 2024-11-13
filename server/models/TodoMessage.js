// models/TodoMessage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const TodoMessage = sequelize.define('TodoMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'read', 'in_progress', 'completed'),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('general', 'step_notification'),
    defaultValue: 'general'
  },
  relatedTaskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  relatedStepId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Steps',
      key: 'id'
    }
  }
});

TodoMessage.associate = (models) => {
  TodoMessage.belongsTo(models.User, { as: 'sender', foreignKey: 'senderId' });
  TodoMessage.belongsTo(models.User, { as: 'recipient', foreignKey: 'recipientId' });

  TodoMessage.belongsTo(models.Task, { as: 'relatedTask', foreignKey: 'relatedTaskId' });
  TodoMessage.belongsTo(models.Step, { as: 'relatedStep', foreignKey: 'relatedStepId' });
};

const syncDatabase = async () => {
  await TodoMessage.sync();
};

syncDatabase();



module.exports = TodoMessage;
