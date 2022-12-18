import { PrismaClient } from '@fullstack-typescript-monorepo/prisma';
import { Request, Response } from 'express';
import auth from '../utils/auth';
import sendError from '../utils/sendError';
import TableUtils, { TableRequestBody } from '../utils/TableUtils';

export interface GenericPrisma extends PrismaClient {
  [key: string]: unknown;
}

export interface MOCK_PrismaModel {
  create: (prop: { data: unknown }) => Promise<unknown>;
  findUniqueOrThrow: (prop: { where: { id: number } }) => Promise<unknown>;
  findMany: (prop?: Record<string, unknown>) => Promise<unknown[]>;
  count: (prop: Record<string, unknown>) => Promise<number>;
  update: (prop: { where: { id: number }; data: unknown }) => Promise<unknown>;
  delete: (prop: { where: { id: number } }) => Promise<unknown>;
}

/**
 * Insert a new object in the database
 * @param model
 */
const insert = (model: string) => (prisma: PrismaClient) => async (
  req: Request<never, unknown, unknown>,
  res: Response,
) => {
  try {
    await auth(prisma, req);

    const { body } = req;
    const prismaModel = (prisma as GenericPrisma)[model] as MOCK_PrismaModel;

    const object = await prismaModel.create({
      data: body,
    });

    res.json(object);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get an object from the database
 * @param model
 */
const get = (model: string) => (prisma: PrismaClient) => async (req: Request, res: Response) => {
  try {
    await auth(prisma, req);

    const { id } = req.params;
    const prismaModel = (prisma as GenericPrisma)[model] as MOCK_PrismaModel;

    const object = await prismaModel.findUniqueOrThrow({
      where: { id: +id },
    });

    res.json(object);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get all objects from the database
 * @param model
 */
const getAll = (model: string) => (prisma: PrismaClient) => async (req: Request, res: Response) => {
  try {
    await auth(prisma, req);

    const prismaModel = (prisma as GenericPrisma)[model] as MOCK_PrismaModel;

    const objects = await prismaModel.findMany();

    res.json(objects);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get all objects from the database as a CSV
 * @param model
 */
const getAllAsCsv = (model: string) => (prisma: PrismaClient) => async (
  req: Request,
  res: Response,
) => {
  try {
    await auth(prisma, req);

    const prismaModel = (prisma as GenericPrisma)[model] as MOCK_PrismaModel;

    const objects = await prismaModel.findMany() as Record<string, unknown>[];

    if (!objects.length) {
      throw new Error('Nothing to export');
    }

    // Create CSV file
    let csv = '';

    // Add headers
    const headers = Object.keys(objects[0]);
    csv += `${headers.join(';')}\n`;

    // Add rows
    objects.forEach((object) => {
      const row = headers.map((header) => object[header]);
      csv += `${row.join(';')}\n`;
    });

    // Send CSV file
    res.header('Content-Type', 'text/csv').send(csv);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get objects for a paginated table
 * @param model
 */
const table = (model: string) => (prisma: PrismaClient) => async (
  req: Request<never, unknown, TableRequestBody>,
  res: Response,
) => {
  try {
    await auth(prisma, req);

    const prismaModel = (prisma as GenericPrisma)[model] as MOCK_PrismaModel;

    res.json(TableUtils.getData(req, prismaModel));
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Update an object in the database
 * @param model
 */
const update = (model: string) => (prisma: PrismaClient) => async (
  req: Request<{ id: string }, unknown, Record<string, unknown>>,
  res: Response,
) => {
  try {
    await auth(prisma, req);

    const { id } = req.params;
    const { body } = req;
    const prismaModel = (prisma as GenericPrisma)[model] as MOCK_PrismaModel;

    const updatedObject = await prismaModel.update({
      where: { id: +id },
      data: { ...body },
    });

    res.json(updatedObject);
  } catch (error) {
    sendError(res, error);
  }
};

const deleteObject = (model: string) => (prisma: PrismaClient) => async (
  req: Request,
  res: Response,
) => {
  try {
    await auth(prisma, req);

    const { id } = req.params;
    const prismaModel = (prisma as GenericPrisma)[model] as MOCK_PrismaModel;

    await prismaModel.delete({
      where: { id: +id },
    });

    res.send();
  } catch (error) {
    sendError(res, error);
  }
};

const REST = (model: string) => ({
  insert: insert(model),
  get: get(model),
  getAll: getAll(model),
  getAllAsCsv: getAllAsCsv(model),
  table: table(model),
  update: update(model),
  delete: deleteObject(model),
});

export default REST;