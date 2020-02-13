import { Test } from '@nestjs/testing';
import { LotsService } from './lots.service';
import { LotRepository } from './lot.repository';
import { SendEmailService } from '../mail/sendEmailService';
import { MailerModule } from '@nest-modules/mailer';
import { mailerModuleConfig } from '../config/mailer-module-config';
import { NotFoundException } from '@nestjs/common';

const mockUser =  {
  id: 1,
  firstName: 'Test user',
  lastName: 'Pavlova',
  email: 'pavlova@google.com',
  phone: '111111111111',
  password: 'Qwerty123',
  birthday: '1992-12-19',
};

const img = 'imgurl';

const createLotDto = {
  title: 'lot title example',
  description: 'lot desc example',
  startTime: '2020-02-27',
  endTime: '2020-03-27',
  curentPrice: 10,
  estimatedPrice: 5000,
  image: img,
};

const mockLot = { title: 'Test lot', description: 'Test desc' };

const mockLotRepository = () => ({
  createLot: jest.fn(),
  getLots: jest.fn(),
  getMyLots: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('LotsService', () => {
  let lotsService;
  let lotRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LotsService,
        SendEmailService,
        { provide: LotRepository, useFactory: mockLotRepository },
      ],
      imports: [
        MailerModule.forRootAsync(mailerModuleConfig),
      ],
    }).compile();

    lotsService = await module.get<LotsService>(LotsService);
    lotRepository = await module.get<LotRepository>(LotRepository);
  });

  describe('createLot', () => {
    it('calls lotRepository.create() and returns the result', async () => {
      lotRepository.createLot.mockResolvedValue('someLot');

      expect(lotRepository.createLot).not.toHaveBeenCalled();

      const result = await lotsService.createLot(createLotDto, mockUser, img);
      expect(lotRepository.createLot).toHaveBeenCalledWith(createLotDto, mockUser, img);
      expect(result).toEqual('someLot');
    });
  });

  describe('getLots', () => {
    it('gets all lots from the repository', async () => {
      lotRepository.getLots.mockResolvedValue('someValue');

      expect(lotRepository.getLots).not.toHaveBeenCalled();
      const filterDto = {};
      const result = await lotsService.getLots(filterDto, mockUser);
      expect(lotRepository.getLots).toHaveBeenCalled();
      expect(result).toEqual('someValue');
    });
  });

  describe('getMyLots', () => {
    it('gets all my lots from the repository', async () => {
      lotRepository.getMyLots.mockResolvedValue('someValue');

      expect(lotRepository.getMyLots).not.toHaveBeenCalled();
      const filterDto = {};
      const result = await lotsService.getMyLots(filterDto, mockUser);
      expect(lotRepository.getMyLots).toHaveBeenCalled();
      expect(result).toEqual('someValue');
    });
  });

  describe('getLotById', () => {
    it('calls lotRepository.findOne() and succesffuly retrieve and return the lot', async () => {
      lotRepository.findOne.mockResolvedValue(mockLot);

      const lot = await lotsService.getLotById(1, mockUser);
      expect(lot).toEqual(mockLot);

      expect(lotRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
    it('throws an error as lot is not found', () => {
      lotRepository.findOne.mockResolvedValue(null);
      expect(lotsService.getLotById(1, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteLotById', () => {
    it('calls lotRepository.delete() to delete a lot', async () => {
      lotRepository.delete.mockResolvedValue({ affected: 1 });
      expect(lotRepository.delete).not.toHaveBeenCalled();

      // await lotsService.deleteLotById(1, mockUser);
      // lotRepository.findOne.mockResolvedValue(mockLot);
      // expect(lotRepository.delete).toHaveBeenCalled();
    });

    it('throws an error as lot could not be found', () => {
      lotRepository.delete.mockResolvedValue(null);
      expect(lotsService.deleteLotById(1, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLot', () => {
    it('updates a lot', async () => {
      const save = jest.fn().mockResolvedValue(true);

    });
  });

});
