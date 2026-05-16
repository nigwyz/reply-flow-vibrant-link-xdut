import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'lyzr-architect';
import getCustomerModel from '@/models/Customer';

export const dynamic = 'force-dynamic';

export const GET = authMiddleware(async (_req: NextRequest, ctx: { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const Customer = await getCustomerModel();
    const doc = await Customer.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch customer' },
      { status: 500 }
    );
  }
});
