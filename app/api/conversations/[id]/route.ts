import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'lyzr-architect';
import getConversationModel from '@/models/Conversation';

export const dynamic = 'force-dynamic';

export const GET = authMiddleware(async (_req: NextRequest, ctx: { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const Conversation = await getConversationModel();
    const doc = await Conversation.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
});

export const PATCH = authMiddleware(async (req: NextRequest, ctx: { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const Conversation = await getConversationModel();
    const doc = await Conversation.findByIdAndUpdate(id, body, { new: true });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update conversation' },
      { status: 500 }
    );
  }
});

export const DELETE = authMiddleware(async (_req: NextRequest, ctx: { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const Conversation = await getConversationModel();
    await Conversation.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete conversation' },
      { status: 500 }
    );
  }
});
