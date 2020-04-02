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

@Controller('lots')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class LotsController {
  constructor(
    private lotsService: LotsService,
    private readonly myLogger: MyLogger,
  ) {
    this.myLogger.setContext('LotsController');
  }

  @Post()
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
  getLotById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Lot> {
    return this.lotsService.getLotById(id, user);
  }

  @Get('/:id/payment')
  async payLotById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<any> {
    return this.lotsService.getLotPayment(id, user);
  }

  @Get('/:id/payment/success')
  async success(
    @Param('id', ParseIntPipe) id: number,
    @Query() pi: any,
    @GetUser() user: User,
  ): Promise<string> {
    return this.lotsService.getSuccessPayment(id, user, pi);
  }

  @Get('/:id/payment/cancel')
  sancel(@Param('id', ParseIntPipe) id: number): void {
    this.myLogger.verbose(`User have canceled payment for the lot with identifier: ${id}`,
    );
  }

  @Delete('/:id')
  deleteLotById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.lotsService.deleteLotById(id, user);
  }

  @Patch(':id/edit')
  @UsePipes(ValidationPipe)
  updateLot(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLotDto: UpdateLotDto,
    @GetUser() user: User,
  ): Promise<Lot> {
    return this.lotsService.updateLot(id, updateLotDto, user);
  }
}
