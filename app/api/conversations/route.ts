import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getCurrentUserId } from 'lyzr-architect';
import getConversationModel from '@/models/Conversation';

export const dynamic = 'force-dynamic';

export const GET = authMiddleware(async (_req: NextRequest) => {
  try {
    const Conversation = await getConversationModel();
    const data = await Conversation.find({}).sort({ last_message_at: -1 }).lean();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
});

export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const Conversation = await getConversationModel();
    const userId = getCurrentUserId();
    const doc = await Conversation.create({ ...body, owner_user_id: userId });
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create conversation' },
      { status: 500 }
    );
  }
});
