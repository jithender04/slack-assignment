import mongoose from 'mongoose';
const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    assignee: {
      type: String,
      required: false,
      default: 'unassigned'
    },
    description: {
      type: String,
      required: false
    },
    dueDate: {
      type: Date,
      required: false
    },
    status: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);
const Task = mongoose.model('Task', TaskSchema);
export default Task;