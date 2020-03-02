import {
  Controller,
  UseGuards,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Logger,
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

@Controller('lots')
@UseGuards(AuthGuard('jwt'))
export class LotsController {
  private logger = new Logger('LotsController');

  constructor(private lotsService: LotsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('img', {
      storage: diskStorage({ destination: './static/files', filename: editFileName }),
      fileFilter: imageFileFilter,
    }),
    ClassSerializerInterceptor,
  )
  createLot(@Body() createLotDto: CreateLotDto, @GetUser() user: User, @UploadedFile() img): Promise<Lot> {
    return this.lotsService.createLot(createLotDto, user, img);
  }

  @Get('/my')
  @UseInterceptors(ClassSerializerInterceptor)
  getMyLots(@Query(ValidationPipe) filterDto: GetMyLotsFilterDto, @GetUser() user: User): Promise<Lot[]> {
    this.logger.verbose(`User "${user.email}" retrieving all lots. Filters: ${JSON.stringify(filterDto)}`);
    return this.lotsService.getMyLots(filterDto, user);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  getLots(@Query(ValidationPipe) filterDto: GetLotsFilterDto, @GetUser() user: User): Promise<Lot[]> {
    this.logger.verbose(`User "${user.email}" retrieving all lots. Filters: ${JSON.stringify(filterDto)}`);
    return this.lotsService.getLots(filterDto, user);
  }

  @Get('/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  getLotById(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<Lot> {
    return this.lotsService.getLotById(id, user);
  }

  @Delete('/:id')
  deleteLotById(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<void> {
    return this.lotsService.deleteLotById(id, user);
  }

  @Patch(':id/edit')
  @UseInterceptors(ClassSerializerInterceptor)
  @UsePipes(ValidationPipe)
  updateLot(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLotDto: UpdateLotDto,
    @GetUser() user: User,
  ): Promise<Lot> {
    return this.lotsService.updateLot(id, updateLotDto, user);
  }
}
