import { Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import { ticketsService } from '@/services';
import httpStatus from 'http-status';
import { InputTicketBody } from '@/protocols';
import { Prisma } from '@prisma/client';
import { PrismaClient, Room } from '@prisma/client';

const prisma = new PrismaClient();


export async function getHotels(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = req.userId;

        const enrollment = await prisma.$queryRaw`SELECT * FROM Enrollment e
    WHERE e."userId" = ${userId}
      AND EXISTS (
        SELECT 1
        FROM Ticket t
        JOIN TicketType tt ON t."ticketTypeId" = tt."id"
        WHERE t."enrollmentId" = e."id"
          AND t."status" = 'PAID'
          AND tt."includesHotel" = true
      )`;

        if (!enrollment) {
            res.status(httpStatus.NOT_FOUND).json({ error: 'User has no valid enrollment with paid hotel ticket' });
            return;
        }

        if (!enrollment) {
            res.status(httpStatus.NOT_FOUND).json({ error: 'User has no valid enrollment with paid ticket including hotel' });
            return;
        }

        const hotels: Room[] = await prisma.room.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const formattedHotels = hotels.map((hotel: Room) => ({
            id: hotel.id,
            name: hotel.name,
            createdAt: hotel.createdAt.toISOString(),
            updatedAt: hotel.updatedAt.toISOString(),
        }));

        res.status(httpStatus.OK).json(formattedHotels);
    } catch (error) {
        console.error('Erro:', error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
}


export async function getHotelsById(req: AuthenticatedRequest, res: Response) {
    const { userId } = req
    const ticket = await ticketsService.getTicketByUserId(userId)
    return res.status(httpStatus.OK).send(ticket)
}
