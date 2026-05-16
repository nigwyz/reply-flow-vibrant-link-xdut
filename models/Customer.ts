import { initDB, createModel } from 'lyzr-architect';

let _model: any = null;

export default async function getCustomerModel() {
  if (!_model) {
    await initDB();
    _model = createModel('Customer', {
      channel_id: { type: String, required: true },
      channel: { type: String, enum: ['whatsapp', 'telegram', 'messenger', 'instagram'], required: true },
      name: { type: String, default: '' },
      preferences: { type: Object, default: {} },
      first_contact: { type: Date, default: Date.now },
      last_contact: { type: Date, default: Date.now },
      total_conversations: { type: Number, default: 0 },
    });
  }
  return _model;
}
