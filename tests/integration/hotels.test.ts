import { generateCPF, getStates } from '@brazilian-utils/brazilian-utils';
import faker from '@faker-js/faker';
import dayjs from 'dayjs';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';

import { createEnrollmentWithAddress, createUser, createAddressWithCEP } from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import { prisma } from '@/config';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe('GET /hotels', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/hotels');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 404 if there is no enrollment for given user', async () => {
    const token = await generateValidToken();

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 404 if ticket is not paid or does not include hotel', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 200 and hotel data when there is a valid enrollment', async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user, true, true);
    const token = await generateValidToken(user);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual([
      {
        id: enrollment.Hotel.id,
        name: enrollment.Hotel.name,
        image: enrollment.Hotel.image,
        createdAt: enrollment.Hotel.createdAt.toISOString(),
        updatedAt: enrollment.Hotel.updatedAt.toISOString(),
      },
    ]);
  });
});

describe('GET /hotels/:hotelId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/hotels/1');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 404 if there is no enrollment for given user', async () => {
    const token = await generateValidToken();

    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 404 if ticket is not paid or does not include hotel', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 404 if hotel is not found', async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user, true, true);
    const token = await generateValidToken(user);

    const response = await server.get('/hotels/999').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 200 and hotel data with rooms when there is a valid enrollment and hotel', async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user, true, true);
    const token = await generateValidToken(user);

    const response = await server.get(`/hotels/${enrollment.Hotel.id}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      id: enrollment.Hotel.id,
      name: enrollment.Hotel.name,
      image: enrollment.Hotel.image,
      createdAt: enrollment.Hotel.createdAt.toISOString(),
      updatedAt: enrollment.Hotel.updatedAt.toISOString(),
      Rooms: [
        {
          id: enrollment.Hotel.Rooms[0].id,
          name: enrollment.Hotel.Rooms[0].name,
          capacity: enrollment.Hotel.Rooms[0].capacity,
          hotelId: enrollment.Hotel.Rooms[0].hotelId,
          createdAt: enrollment.Hotel.Rooms[0].createdAt.toISOString(),
          updatedAt: enrollment.Hotel.Rooms[0].updatedAt.toISOString(),
        },
      ],
    });
  });
});
