import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

import { CertificatesService } from './certificates.service';

import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateQueryDto } from './dto/certificate-query.dto';

import { Roles } from '../auth/decorators/roles.decorator';

import { multerOptions } from '../uploads/multer.config';

@ApiTags('Certificates')
@ApiBearerAuth('JWT')
@Controller('certificates')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptions,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        issuer: {
          type: 'string',
        },
        issueDate: {
          type: 'string',
          format: 'date',
        },
        expiryDate: {
          type: 'string',
          format: 'date',
        },
        certificateNo: {
          type: 'string',
        },
        staffId: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Create certificate',
  })
  async create(
    @Body() dto: CreateCertificateDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (user.role === UserRole.STAFF) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { userId: user.sub },
      });
      if (!staffRecord) {
        throw new NotFoundException('Associated staff profile not found');
      }
      dto.staffId = staffRecord.id;
    }

    if (user.role !== UserRole.STAFF) {
      if (!dto.staffId) {
        throw new BadRequestException('staffId is required');
      }
    }

    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: dto.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to add certificates for staff in other organizations');
      }
    }

    return this.certificatesService.create(dto, file);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.STAFF,
  )
  @ApiOperation({
    summary: 'Get certificates',
  })
  async findAll(
    @Query() query: CertificateQueryDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.STAFF) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { userId: user.sub },
      });
      if (!staffRecord) {
        throw new NotFoundException('Associated staff profile not found');
      }
      query.staffId = staffRecord.id;
    }

    if (user.role === UserRole.MANAGER) {
      query.organizationId = user.organizationId;
    }

    return this.certificatesService.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.STAFF,
  )
  @ApiOperation({
    summary: 'Get certificate by id',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const certificate = await this.certificatesService.findOne(id);
    if (user.role === UserRole.STAFF) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { userId: user.sub },
      });
      if (!staffRecord || certificate.staffId !== staffRecord.id) {
        throw new ForbiddenException('You do not have permission to view this certificate');
      }
    }

    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: certificate.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to view this certificate');
      }
    }

    return certificate;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptions,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        issuer: {
          type: 'string',
        },
        issueDate: {
          type: 'string',
          format: 'date',
        },
        expiryDate: {
          type: 'string',
          format: 'date',
        },
        certificateNo: {
          type: 'string',
        },
        staffId: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Update certificate',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCertificateDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const certificate = await this.certificatesService.findOne(id);

    if (user.role === UserRole.STAFF) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { userId: user.sub },
      });
      if (!staffRecord || certificate.staffId !== staffRecord.id) {
        throw new ForbiddenException('You do not have permission to update this certificate');
      }
    }

    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: certificate.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to update certificates in other organizations');
      }
    }

    return this.certificatesService.update(id, dto, file);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Delete certificate',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const certificate = await this.certificatesService.findOne(id);

    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: certificate.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to delete certificates in other organizations');
      }
    }

    return this.certificatesService.remove(id);
  }
}