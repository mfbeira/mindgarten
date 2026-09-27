import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const TagIdentifierSchema = z.union([z.number().int().positive(), z.string().min(1)]);

const CreateLinkSchema = z.object({
  url: z.string().trim().url('Invalid URL format'),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  faviconUrl: z.string().trim().url().optional(),
  tags: z.array(TagIdentifierSchema).optional().default([]),
  createdBy: z.string().trim().optional(),
});

const UpdateLinkSchema = z.object({
  url: z.string().trim().url('Invalid URL format').optional(),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  faviconUrl: z.string().trim().url().optional().nullable(),
  tags: z.array(TagIdentifierSchema).optional(),
});

type FormattedTag = {
  id: number;
  name: string;
  color: string;
  description: string | null;
};

type RawLinkWithTags = {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: {
    tag: {
      id: number;
      name: string;
      color: string | null;
      description: string | null;
    };
  }[];
};

const formatLink = (link: RawLinkWithTags) => ({
  id: link.id,
  url: link.url,
  title: link.title || extractHostname(link.url),
  description: link.description,
  faviconUrl: link.faviconUrl || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=64`,
  createdAt: link.createdAt.toISOString(),
  updatedAt: link.updatedAt.toISOString(),
  createdBy: link.createdBy,
  tags: link.tags.map((lt) => ({
    id: lt.tag.id,
    name: lt.tag.name,
    color: lt.tag.color || '#0f62fe',
    description: lt.tag.description,
  })),
});

const extractHostname = (urlStr: string): string => {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
};

/**
 * Resolves a list of tag IDs or tag names to tag IDs, creating new tags if names are passed
 */
const resolveTagIds = async (tagInputs: (number | string)[]): Promise<number[]> => {
  const resolvedIds: number[] = [];

  for (const input of tagInputs) {
    if (typeof input === 'number') {
      const tag = await prisma.tag.findUnique({ where: { id: input } });
      if (tag) {
        resolvedIds.push(tag.id);
      }
    } else if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) continue;
      // Find or create tag by name
      const existing = await prisma.tag.findUnique({ where: { name: trimmed } });
      if (existing) {
        resolvedIds.push(existing.id);
      } else {
        const created = await prisma.tag.create({
          data: {
            name: trimmed,
            color: '#0f62fe',
          },
        });
        resolvedIds.push(created.id);
      }
    }
  }

  return Array.from(new Set(resolvedIds));
};

export const linkRoutes = async (fastify: FastifyInstance) => {
  // List all links with pagination, search, and filtering
  fastify.get('/links', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      skip?: string;
      take?: string;
      tag?: string;
      search?: string;
      sort?: string;
    };

    const skip = Math.max(0, parseInt(query.skip || '0', 10) || 0);
    const take = Math.min(100, Math.max(1, parseInt(query.take || '20', 10) || 20));
    const search = query.search?.trim();
    const tagFilter = query.tag?.trim();

    const where: any = {};

    if (tagFilter) {
      const tagId = parseInt(tagFilter, 10);
      if (!isNaN(tagId)) {
        where.tags = {
          some: { tagId },
        };
      } else {
        where.tags = {
          some: { tag: { name: { equals: tagFilter, mode: 'insensitive' } } },
        };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = query.sort === 'oldest'
      ? { createdAt: 'asc' }
      : query.sort === 'alphabetical'
      ? { title: 'asc' }
      : { createdAt: 'desc' };

    try {
      const [links, total] = await Promise.all([
        prisma.link.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            tags: {
              include: { tag: true },
            },
          },
        }),
        prisma.link.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: links.map(formatLink),
        total,
        skip,
        take,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to list links');
      return reply.status(500).send({ success: false, error: 'Failed to list links' });
    }
  });

  // Dedicated search endpoint: GET /links/search?q=
  fastify.get('/links/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const { q = '' } = request.query as { q?: string };
    const query = q.trim();

    if (!query) {
      return reply.send({
        success: true,
        data: [],
        query: '',
        total: 0,
      });
    }

    try {
      const links = await prisma.link.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { url: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: links.map(formatLink),
        query,
        total: links.length,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to search links');
      return reply.status(500).send({ success: false, error: 'Failed to search links' });
    }
  });

  // Filter links by tag ID: GET /links/tag/:tagId
  fastify.get('/links/tag/:tagId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tagId } = request.params as { tagId: string };
    const id = parseInt(tagId, 10);

    if (isNaN(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid tag ID' });
    }

    try {
      const links = await prisma.link.findMany({
        where: {
          tags: {
            some: { tagId: id },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: links.map(formatLink),
        tagId: id,
        total: links.length,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get links by tag');
      return reply.status(500).send({ success: false, error: 'Failed to get links by tag' });
    }
  });

  // Get link by ID: GET /links/:id
  fastify.get('/links/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return reply.status(400).send({ success: false, error: 'Invalid link ID' });
    }

    try {
      const link = await prisma.link.findUnique({
        where: { id: linkId },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      if (!link) {
        return reply.status(404).send({ success: false, error: 'Link not found' });
      }

      return reply.send({
        success: true,
        data: formatLink(link),
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get link');
      return reply.status(500).send({ success: false, error: 'Failed to get link' });
    }
  });

  // Create new link: POST /links
  fastify.post('/links', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = CreateLinkSchema.parse(request.body);

      // Check if URL already exists
      const existing = await prisma.link.findUnique({
        where: { url: body.url },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: 'Link with this URL already exists',
          data: formatLink(existing),
        });
      }

      const tagIds = await resolveTagIds(body.tags);

      const title = body.title?.trim() || extractHostname(body.url);
      const callerName = body.createdBy || (request as any).callerName || 'user';

      const created = await prisma.link.create({
        data: {
          url: body.url,
          title,
          description: body.description?.trim() || null,
          faviconUrl: body.faviconUrl || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(body.url)}&sz=64`,
          createdBy: callerName,
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      return reply.status(201).send({
        success: true,
        data: formatLink(created),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors.map((e) => e.message).join(', '),
        });
      }
      fastify.log.error({ error }, 'Failed to create link');
      return reply.status(500).send({ success: false, error: 'Failed to create link' });
    }
  });

  // Update link: PUT /links/:id
  fastify.put('/links/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return reply.status(400).send({ success: false, error: 'Invalid link ID' });
    }

    try {
      const body = UpdateLinkSchema.parse(request.body);

      const existing = await prisma.link.findUnique({
        where: { id: linkId },
      });

      if (!existing) {
        return reply.status(404).send({ success: false, error: 'Link not found' });
      }

      // Check url collision
      if (body.url && body.url !== existing.url) {
        const urlDuplicate = await prisma.link.findUnique({
          where: { url: body.url },
        });
        if (urlDuplicate) {
          return reply.status(409).send({
            success: false,
            error: 'Another link with this URL already exists',
          });
        }
      }

      // If tags are provided, update relation
      let tagsUpdate: any = undefined;
      if (body.tags !== undefined) {
        const tagIds = await resolveTagIds(body.tags);
        tagsUpdate = {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        };
      }

      const updated = await prisma.link.update({
        where: { id: linkId },
        data: {
          url: body.url,
          title: body.title,
          description: body.description,
          faviconUrl: body.faviconUrl,
          tags: tagsUpdate,
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: formatLink(updated),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors.map((e) => e.message).join(', '),
        });
      }
      fastify.log.error({ error }, 'Failed to update link');
      return reply.status(500).send({ success: false, error: 'Failed to update link' });
    }
  });

  // Delete link: DELETE /links/:id
  fastify.delete('/links/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return reply.status(400).send({ success: false, error: 'Invalid link ID' });
    }

    try {
      const existing = await prisma.link.findUnique({
        where: { id: linkId },
      });

      if (!existing) {
        return reply.status(404).send({ success: false, error: 'Link not found' });
      }

      await prisma.link.delete({
        where: { id: linkId },
      });

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error({ error }, 'Failed to delete link');
      return reply.status(500).send({ success: false, error: 'Failed to delete link' });
    }
  });
};
