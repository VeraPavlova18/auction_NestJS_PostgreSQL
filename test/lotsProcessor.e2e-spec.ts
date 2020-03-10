import { UserRepository } from '../src/auth/user.repository';
import { createTestingAppModule } from './config/testingmodule-config';
import { LotRepository } from '../src/lots/lot.repository';
import { deleteFromTables } from './utils/deleteFromTables';
import { createUsers } from './utils/createData';
import { LotStatus } from '../src/lots/lot-status.enum';

describe('LotsProcessor (e2e)', () => {
  let lotRepository: LotRepository;
  let userRepository: UserRepository;
  let client;
  let lotsProcessor;
  let usersExist;

  beforeAll(async () => {
    const init = await createTestingAppModule();
    client = init.client;
    lotRepository = init.lotRepository;
    userRepository = init.authRepository;
    lotsProcessor = init.lotsProcessor;

    usersExist = (await createUsers(client, userRepository)).usersExist;
  });

  afterAll(async () => {
    await deleteFromTables({lot: lotRepository, user: userRepository});
  });

  describe('Lots processor', () => {
    it('should change lot status for "IN_PROCESS"', async () => {
      const createLotquery = `INSERT INTO "lot" (
        title,
        description,
        image,
        "createdAt",
        "startTime",
        "endTime",
        "curentPrice",
        "estimatedPrice",
        status,
        "userId"
      )
      VALUES (
        'title1',
         'desc1',
         '',
         '2020-03-10T11:52:08.797Z',
         '2020-03-10T11:54:05.140Z',
         '2020-03-10T11:56:05.141Z',
         6,
         666,
         'PENDING',
         ${usersExist[0].id}
      );`;
      await lotRepository.query(createLotquery);
      let lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      let lot = lotsExist[0];
      expect(lot.status).toEqual(LotStatus.PENDING);

      await lotsProcessor.startLot({ data: { lotId: lot.id } });
      lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      lot = lotsExist[0];
      expect(lot.status).toEqual(LotStatus.IN_PROCESS);
    });

    it('should change lot status for "CLOSED"', async () => {
      let lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      let lot = lotsExist[0];
      expect(lot.status).toEqual(LotStatus.IN_PROCESS);

      await lotsProcessor.closeLot({ data: { lotId: lot.id } });
      lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      lot = lotsExist[0];
      expect(lot.status).toEqual(LotStatus.CLOSED);
    });
  });

});
