const express = require('express');
const { Op } = require('sequelize');
const Task = require('../models/Task');
const Step = require('../models/Step');
const StepTemp = require('../models/StepTemp');
const Work = require('../models/Work');
const sequelize = require('../database');
const router = express.Router();

// Utility per validazione
const validateTaskData = (data) => {
  const errors = [];
  if (!data.patient) errors.push('Patient is required');
  if (!data.workid) errors.push('Work ID is required');
  if (!data.deliveryDate) errors.push('Delivery date is required');
  return errors;
};

// Rate limiting configuration
const rateLimit = require('express-rate-limit');
const createTaskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// GET route with enhanced error handling
router.get('/', async (req, res) => {
  const { patient, workid, deliveryDate, completed } = req.query;
  try {
    let whereClause = {};
    if (patient) whereClause.patient = patient;
    if (workid) whereClause.workid = workid;
    if (completed) whereClause.completed = completed;

    const records = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: Work,
          attributes: ['name', 'description']
        }
      ]
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      error: 'Failed to fetch tasks',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify template availability
router.get('/verify-template/:workid', async (req, res) => {
  const { workid } = req.params;
  try {
    // Verifica che il work esista
    const work = await Work.findByPk(workid);
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }

    // Conta gli step template disponibili
    const templateCount = await StepTemp.count({ where: { workid } });

    res.json({
      hasTemplate: templateCount > 0,
      templateCount,
      workName: work.name
    });
  } catch (error) {
    console.error('Error verifying template:', error);
    res.status(500).json({ error: 'Failed to verify template availability' });
  }
});

// Enhanced POST route with template processing
router.post('/', createTaskLimiter, async (req, res) => {
  const { patient, workid, deliveryDate, completed = false } = req.body;

  // Validation
  const validationErrors = validateTaskData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validationErrors
    });
  }

  // Start transaction
  const transaction = await sequelize.transaction();

  try {
    // 1. Verify work exists
    const work = await Work.findByPk(workid);
    if (!work) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Work not found' });
    }

    // 2. Create task
    const task = await Task.create({
      patient,
      workid,
      deliveryDate,
      completed
    }, { transaction });

    // 3. Get template steps
    const templateSteps = await StepTemp.findAll({
      where: { workid },
      order: [['order', 'ASC']],
      limit: 100 // Reasonable limit to prevent issues
    });

    if (templateSteps.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'No template steps found for this work'
      });
    }

    // 4. Create steps from template
    const steps = await Promise.all(
      templateSteps.map(template =>
        Step.create({
          taskid: task.id,
          name: template.name,
          completed: false,
          userid: template.userid,
          order: template.order
        }, { transaction })
      )
    );

    // 5. Commit transaction
    await transaction.commit();

    // 6. Return success response with complete data
    res.status(201).json({
      task,
      steps,
      message: 'Task and steps created successfully',
      stepCount: steps.length
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();

    console.error('Error in task creation process:', error);

    // Send appropriate error response
    res.status(500).json({
      error: 'Failed to create task and steps',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      step: error.step // If we know which step failed
    });
  }
});

// Enhanced PUT route
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { patient, workid, deliveryDate, completed } = req.body;

  try {
    const record = await Task.findByPk(id, {
      include: [{ model: Step }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    record.patient = patient || record.patient;
    record.workid = workid || record.workid;
    record.deliveryDate = deliveryDate || record.deliveryDate;
    record.completed = completed ?? record.completed;

    await record.save();

    res.json({
      task: record,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      error: 'Failed to update task',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced DELETE route with cascade
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const record = await Task.findByPk(id);
    if (!record) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete related steps first
    await Step.destroy({
      where: { taskid: id },
      transaction
    });

    // Delete the task
    await record.destroy({ transaction });

    await transaction.commit();

    res.json({
      message: 'Task and related steps deleted successfully',
      taskId: id
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting task:', error);
    res.status(500).json({
      error: 'Failed to delete task',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
