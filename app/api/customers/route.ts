import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getCurrentUserId } from 'lyzr-architect';
import getCustomerModel from '@/models/Customer';

export const dynamic = 'force-dynamic';

export const GET = authMiddleware(async (_req: NextRequest) => {
  try {
    const Customer = await getCustomerModel();
    const data = await Customer.find({}).sort({ last_contact: -1 }).lean();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch customers' },
      { status: 500 }
    );
  }
});

export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const Customer = await getCustomerModel();
    const userId = getCurrentUserId();
    // Upsert by channel + channel_id
    const existing = await Customer.findOne({ channel: body.channel, channel_id: body.channel_id });
    if (existing) {
      existing.name = body.name || existing.name;
      existing.last_contact = new Date();
      existing.total_conversations = (existing.total_conversations || 0) + (body.increment ? 1 : 0);
      if (body.preferences) existing.preferences = { ...existing.preferences, ...body.preferences };
      await existing.save();
      return NextResponse.json({ success: true, data: existing });
    }
    const doc = await Customer.create({
      channel_id: body.channel_id,
      channel: body.channel,
      name: body.name || '',
      preferences: body.preferences || {},
      total_conversations: body.increment ? 1 : 0,
      owner_user_id: userId,
    });
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upsert customer' },
      { status: 500 }
    );
  }
});
