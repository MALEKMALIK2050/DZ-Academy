// app/api/forum/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const chapitreId = searchParams.get('chapitreId')

    const forums = await prisma.forum.findMany({
      where: {
        ...(courseId ? { courseId: parseInt(courseId) } : {}),
        ...(chapitreId ? { chapitreId: parseInt(chapitreId) } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, nom: true, prenom: true, role: true },
        },
        chapter: {
          select: { id: true, title: true },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ forums })
  } catch (err) {
    console.error('[GET /api/forum]', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      chapitreId,
      courseId,
      position,
      isModerated,
      isRequired,
      allowAnonymous,
      isPeerReview,
      notifyTeacher,
      openAt,
      closeAt,
    } = body

    if (!title || !chapitreId) {
      return NextResponse.json(
        { error: 'Titre et chapitre obligatoires' },
        { status: 400 }
      )
    }

    const forum = await prisma.forum.create({
      data: {
        title,
        description,
        type: type ?? 'OPEN',
        position: position ?? 'END',
        status: 'DRAFT',
        chapitreId: parseInt(chapitreId),
        courseId: courseId ? parseInt(courseId) : null,
        createdById: parseInt(session.user.id),
        isModerated: isModerated ?? false,
        isRequired: isRequired ?? false,
        allowAnonymous: allowAnonymous ?? false,
        isPeerReview: isPeerReview ?? false,
        notifyTeacher: notifyTeacher ?? true,
        openAt: openAt ? new Date(openAt) : null,
        closeAt: closeAt ? new Date(closeAt) : null,
      },
    })

    return NextResponse.json({ forum }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/forum]', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}