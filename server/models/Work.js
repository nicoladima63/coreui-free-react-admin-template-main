const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Work = sequelize.define('Work', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  providerid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Providers',
      key: 'id',
    },
  },
  categoryid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Categories',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.STRING, // Cambiato da ENUM a STRING per SQLite
    defaultValue: 'active',
  },
  metadata: {
    type: DataTypes.TEXT, // Cambiato da JSONB a TEXT per SQLite
    defaultValue: '{}',
    get() {
      const value = this.getDataValue('metadata')
      return value ? JSON.parse(value) : {}
    },
    set(value) {
      this.setDataValue('metadata', JSON.stringify(value))
    },
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
})

// Hooks
Work.beforeDestroy(async (work, options) => {
  const StepTemp = require('./StepTemp')
  await StepTemp.destroy({
    where: { workid: work.id },
    transaction: options.transaction,
  })
})

Work.prototype.duplicate = async function (newName = null) {
  const StepTemp = require('./StepTemp')
  const transaction = await sequelize.transaction()

  try {
    // Clone del work
    const workData = this.toJSON()
    delete workData.id
    workData.name = newName || `${workData.name} (Copy)`
    workData.version = 1
    workData.metadata = JSON.stringify({
      ...JSON.parse(workData.metadata || '{}'),
      clonedFrom: this.id,
    })

    const newWork = await Work.create(workData, { transaction })

    // Clone degli step template
    const steps = await StepTemp.findAll({
      where: { workid: this.id },
      order: [['order', 'ASC']],
    })

    for (const step of steps) {
      const stepData = step.toJSON()
      delete stepData.id
      stepData.workid = newWork.id
      await StepTemp.create(stepData, { transaction })
    }

    await transaction.commit()
    return newWork
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

Work.prototype.export = function () {
  return {
    name: this.name,
    description: this.description,
    category: this.category,
    provider: this.provider,
    steps: this.steps,
    version: this.version,
    exportedAt: new Date().toISOString(),
  }
}

Work.import = async function (data) {
  const transaction = await sequelize.transaction()
  try {
    const { steps, ...workData } = data
    const work = await Work.create(workData, { transaction })

    if (steps && steps.length > 0) {
      const StepTemp = require('./StepTemp')
      for (const step of steps) {
        await StepTemp.create(
          {
            ...step,
            workid: work.id,
          },
          { transaction },
        )
      }
    }

    await transaction.commit()
    return work
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

const syncDatabase = async () => {
  await Work.sync()
}

syncDatabase()

module.exports = Work
