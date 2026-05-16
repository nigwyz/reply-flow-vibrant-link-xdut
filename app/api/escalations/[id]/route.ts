import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'lyzr-architect';
import getEscalationModel from '@/models/Escalation';
import getConversationModel from '@/models/Conversation';

export const dynamic = 'force-dynamic';

export const PATCH = authMiddleware(async (req: NextRequest, ctx: { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const Escalation = await getEscalationModel();
    const updateData: any = { ...body };
    if (body.status === 'resolved' && !body.resolved_at) {
      updateData.resolved_at = new Date();
    }
    const doc = await Escalation.findByIdAndUpdate(id, updateData, { new: true });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    // Also flip the conversation to resolved
    if (body.status === 'resolved' && doc.conversation_id) {
      try {
        const Conversation = await getConversationModel();
        await Conversation.findByIdAndUpdate(doc.conversation_id, { status: 'resolved' });
      } catch (e) {
        // non-fatal
      }
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update escalation' },
      { status: 500 }
    );
  }
});

export const GET = authMiddleware(async (_req: NextRequest, ctx: { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const Escalation = await getEscalationModel();
    const doc = await Escalation.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch escalation' },
      { status: 500 }
    );
  }
});
