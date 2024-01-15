import { createTicket, getTicket, getTicketTypes } from "@/controllers";
import { authenticateToken, validateBody } from "@/middlewares";
import { createTicketSchema } from "@/schemas";
import { Router } from "express";
import { getHotels } from "@/controllers/hotels-controller";
import { getHotelById } from "@/controllers/hotels-controller";

const hotelsRouter = Router();

hotelsRouter
    .all('/*', authenticateToken)
    .get('/', getHotels) ///get Hotels
    .get('/', getHotelById) ///get /hotels/:hotelId 
export { hotelsRouter }