import { initDB, createModel } from 'lyzr-architect';

let _model: any = null;

export default async function getEscalationModel() {
  if (!_model) {
    await initDB();
    _model = createModel('Escalation', {
      conversation_id: { type: String, required: true },
      customer_name: { type: String, default: '' },
      channel: { type: String, default: '' },
      reason: { type: String, required: true },
      status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
      escalated_at: { type: Date, default: Date.now },
      resolved_at: { type: Date, default: null },
      resolution_notes: { type: String, default: '' },
    });
  }
  return _model;
}
