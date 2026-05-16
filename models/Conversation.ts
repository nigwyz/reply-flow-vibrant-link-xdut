import { initDB, createModel } from 'lyzr-architect';

let _model: any = null;

export default async function getConversationModel() {
  if (!_model) {
    await initDB();
    _model = createModel('Conversation', {
      customer_id: { type: String, required: true },
      channel: { type: String, enum: ['whatsapp', 'telegram', 'messenger', 'instagram'], required: true },
      customer_name: { type: String, default: '' },
      messages: {
        type: [
          {
            role: { type: String, enum: ['agent', 'customer'], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
          },
        ],
        default: [],
      },
      status: { type: String, enum: ['active', 'escalated', 'resolved'], default: 'active' },
      last_message_preview: { type: String, default: '' },
      last_message_at: { type: Date, default: Date.now },
    });
  }
  return _model;
}
