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
    type: DataTypes.STRING,  // Cambiato da ENUM a STRING
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high']]  // Validazione per simulare ENUM
    }
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
    type: DataTypes.STRING,  // Cambiato da ENUM a STRING
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'read', 'in_progress', 'completed']]  // Validazione per simulare ENUM
    }
  },
  type: {
    type: DataTypes.STRING,  // Cambiato da ENUM a STRING
    defaultValue: 'general',
    validate: {
      isIn: [['general', 'step_notification']]  // Validazione per simulare ENUM
    }
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

// Definiamo le associazioni
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
