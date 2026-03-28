// ============================================================
// GET  /api/leads       — Fetch saved leads
// POST /api/leads       — Save new leads
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveLeadsSchema, updateLeadSchema } from '@/lib/validations';
import { z } from 'zod';

/** GET /api/leads?status=new&city=&category=&page=1&limit=50 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const favorite = searchParams.get('favorite');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10);
    const limit = Math.min(Math.max(rawLimit, 1), 100); // cap between 1 and 100

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (category) where.category = category;
    if (favorite === 'true' || favorite === '1') where.isFavorite = true;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [
          { isFavorite: 'desc' },
          { leadScore: 'desc' },
          { savedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Fetch leads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 },
    );
  }
}

/** POST /api/leads — Bulk save leads */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = saveLeadsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { leads } = parsed.data;

    // Upsert each lead (skip duplicates by placeId)
    let savedCount = 0;
    let skippedCount = 0;

    for (const lead of leads) {
      try {
        await prisma.lead.upsert({
          where: { placeId: lead.placeId },
          create: {
            placeId: lead.placeId,
            businessName: lead.businessName,
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            rating: lead.rating,
            ratingCount: lead.ratingCount,
            category: lead.category,
            city: lead.city,
            hasWebsite: lead.hasWebsite,
            websiteSpeed: lead.websiteSpeed,
            websiteStatus: lead.websiteStatus,
            leadScore: lead.leadScore ?? null,
          },
          update: {
            // Update fields on re-save
            phone: lead.phone,
            website: lead.website,
            rating: lead.rating,
            ratingCount: lead.ratingCount,
            websiteSpeed: lead.websiteSpeed,
            websiteStatus: lead.websiteStatus,
            leadScore: lead.leadScore ?? null,
          },
        });
        savedCount++;
      } catch {
        skippedCount++;
      }
    }

    return NextResponse.json({
      saved: savedCount,
      skipped: skippedCount,
      message: `Saved ${savedCount} leads${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
    });
  } catch (error) {
    console.error('Save leads error:', error);
    return NextResponse.json(
      { error: 'Failed to save leads' },
      { status: 500 },
    );
  }
}

/** PATCH /api/leads — Update lead status/notes */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { id, status, notes, lastContactedAt, isFavorite } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (lastContactedAt) updateData.lastContactedAt = new Date(lastContactedAt);
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    if (status === 'contacted' && !lastContactedAt) {
      updateData.lastContactedAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ lead: updated });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 },
    );
  }
}

/** DELETE /api/leads — Delete a lead */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID format
    const idSchema = z.string().min(1, 'Lead ID required').max(100);
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    await prisma.lead.delete({ where: { id: parsed.data } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 },
    );
  }
}
