import {
  Controller,
  UseGuards,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';
import { GetLotsFilterDto } from './dto/get-Lots-filter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { editFileName, imageFileFilter } from '../utils/img-uploading.utils';
import { UpdateLotDto } from './dto/update-lot.dto copy';
import { MyLogger } from '../logger/my-logger.service';
import Stripe from 'stripe';

@Controller('lots')
@UseInterceptors(ClassSerializerInterceptor)
export class LotsController {
  constructor(
    private lotsService: LotsService,
    private readonly myLogger: MyLogger,
  ) {
    this.myLogger.setContext('LotsController');
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('img', {
      storage: diskStorage({
        destination: './static/files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  createLot(
    @Body() createLotDto: CreateLotDto,
    @GetUser() user: User,
    @UploadedFile() img,
  ): Promise<Lot> {
    return this.lotsService.createLot(createLotDto, user, img);
  }

  @Get('/my')
  @UseGuards(AuthGuard('jwt'))
  getMyLots(
    @Query(ValidationPipe) filterDto: GetMyLotsFilterDto,
    @GetUser() user: User,
  ): Promise<Lot[]> {
    this.myLogger.verbose(
      `User "${user.email}" retrieving all lots. Filters: ${JSON.stringify(
        filterDto,
      )}`,
    );
    return this.lotsService.getMyLots(filterDto, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getLots(
    @Query(ValidationPipe) filterDto: GetLotsFilterDto,
    @GetUser() user: User,
  ): Promise<Lot[]> {
    this.myLogger.verbose(
      `User "${user.email}" retrieving all lots. Filters: ${JSON.stringify(
        filterDto,
      )}`,
    );
    return this.lotsService.getLots(filterDto, user);
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  getLotById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Lot> {
    return this.lotsService.getLotById(id, user);
  }

  @Get('/:id/payment')
  @UseGuards(AuthGuard('jwt'))
  async payLotById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<any> {
    return this.lotsService.getLotPayment(id, user);
  }

  @Get('/:id/payment/success')
  async success(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: any,
  ): Promise<string> {
    this.myLogger.verbose(`User payment was successful for the lot with id: ${id}`);
    return 'Your payment was successful';
  }

  @Get('/:id/payment/cancel')
  sancel(@Param('id', ParseIntPipe) id: number): string {
    this.myLogger.verbose(`User have canceled payment for the lot with identifier: ${id}`,
    );
    return 'You have canceled payment';
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  deleteLotById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.lotsService.deleteLotById(id, user);
  }

  @Patch(':id/edit')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  updateLot(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLotDto: UpdateLotDto,
    @GetUser() user: User,
  ): Promise<Lot> {
    return this.lotsService.updateLot(id, updateLotDto, user);
  }
}
