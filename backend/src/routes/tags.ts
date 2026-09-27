import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const CreateTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid 6-char hex code (#RRGGBB)').optional().default('#0f62fe'),
  description: z.string().trim().optional(),
});

const UpdateTagSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid 6-char hex code (#RRGGBB)').optional(),
  description: z.string().trim().optional(),
});

export const tagRoutes = async (fastify: FastifyInstance) => {
  // List all tags
  fastify.get('/tags', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { links: true },
          },
        },
      });

      const formatted = tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color || '#0f62fe',
        description: t.description,
        linkCount: t._count.links,
      }));

      return reply.send({
        success: true,
        data: formatted,
        total: formatted.length,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch tags');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch tags',
      });
    }
  });

  // Get tag by ID
  fastify.get('/tags/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return reply.status(400).send({ success: false, error: 'Invalid tag ID' });
    }

    try {
      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        include: {
          _count: {
            select: { links: true },
          },
        },
      });

      if (!tag) {
        return reply.status(404).send({ success: false, error: 'Tag not found' });
      }

      return reply.send({
        success: true,
        data: {
          id: tag.id,
          name: tag.name,
          color: tag.color || '#0f62fe',
          description: tag.description,
          linkCount: tag._count.links,
        },
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch tag');
      return reply.status(500).send({ success: false, error: 'Failed to fetch tag' });
    }
  });

  // Create new tag
  fastify.post('/tags', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = CreateTagSchema.parse(request.body);

      // Check if tag with same name already exists
      const existing = await prisma.tag.findUnique({
        where: { name: body.name },
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: `Tag '${body.name}' already exists`,
          data: existing,
        });
      }

      const tag = await prisma.tag.create({
        data: {
          name: body.name,
          color: body.color,
          description: body.description,
        },
      });

      return reply.status(201).send({
        success: true,
        data: tag,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors.map((e) => e.message).join(', '),
        });
      }
      fastify.log.error({ error }, 'Failed to create tag');
      return reply.status(500).send({ success: false, error: 'Failed to create tag' });
    }
  });

  // Update tag
  fastify.put('/tags/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return reply.status(400).send({ success: false, error: 'Invalid tag ID' });
    }

    try {
      const body = UpdateTagSchema.parse(request.body);

      const existing = await prisma.tag.findUnique({
        where: { id: tagId },
      });

      if (!existing) {
        return reply.status(404).send({ success: false, error: 'Tag not found' });
      }

      // Check name collision
      if (body.name && body.name !== existing.name) {
        const duplicate = await prisma.tag.findUnique({
          where: { name: body.name },
        });
        if (duplicate) {
          return reply.status(409).send({
            success: false,
            error: `Tag name '${body.name}' already exists`,
          });
        }
      }

      const updated = await prisma.tag.update({
        where: { id: tagId },
        data: body,
      });

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors.map((e) => e.message).join(', '),
        });
      }
      fastify.log.error({ error }, 'Failed to update tag');
      return reply.status(500).send({ success: false, error: 'Failed to update tag' });
    }
  });

  // Delete tag
  fastify.delete('/tags/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return reply.status(400).send({ success: false, error: 'Invalid tag ID' });
    }

    try {
      const existing = await prisma.tag.findUnique({
        where: { id: tagId },
      });

      if (!existing) {
        return reply.status(404).send({ success: false, error: 'Tag not found' });
      }

      await prisma.tag.delete({
        where: { id: tagId },
      });

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error({ error }, 'Failed to delete tag');
      return reply.status(500).send({ success: false, error: 'Failed to delete tag' });
    }
  });
};
