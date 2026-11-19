import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Prisma,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

import { CreateCompetencyDto } from './dto/create-competency.dto';
import { UpdateCompetencyDto } from './dto/update-competency.dto';
import { CompetencyQueryDto } from './dto/competency-query.dto';
import { RequestAuditDto } from './dto/request-audit.dto';

@Injectable()
export class CompetenciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async requestAudit(userSub: string, dto: RequestAuditDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { userId: userSub },
      include: { organization: true, user: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    const existingPending = await this.prisma.competency.findFirst({
      where: {
        staffId: staff.id,
        name: dto.competency,
        level: 'PENDING',
      },
    });

    const shiftText = dto.shift || 'Upcoming Shift';
    const notesText = `[Requested for ${shiftText}] ${dto.notes || ''}`.trim();
    const checklistData = [
      {
        item: `Practical observation check requested for ${shiftText}`,
        passed: false,
        requestedAt: new Date().toISOString(),
        shift: shiftText,
        notes: dto.notes || '',
      },
    ];

    let competency;
    if (existingPending) {
      competency = await this.prisma.competency.update({
        where: { id: existingPending.id },
        data: {
          achievedOn: new Date(),
          assessorNotes: notesText,
          checklist: checklistData,
        },
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      });
    } else {
      competency = await this.prisma.competency.create({
        data: {
          staffId: staff.id,
          name: dto.competency,
          level: 'PENDING',
          achievedOn: new Date(),
          assessorNotes: notesText,
          checklist: checklistData,
        },
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    // Find managers of this organization to notify
    const managers = await this.prisma.user.findMany({
      where: {
        organizationId: staff.organizationId,
        role: { in: [UserRole.MANAGER, UserRole.ADMIN] },
        status: 'ACTIVE',
      },
    });

    const formattedCompetency = dto.competency.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const staffName = `${staff.firstName} ${staff.lastName}`.trim();

    for (const manager of managers) {
      try {
        await this.notificationsService.create({
          userId: manager.id,
          title: `Bedside Audit Request: ${formattedCompetency}`,
          message: `${staffName} has requested a bedside practical observation (${shiftText}).`,
          type: NotificationType.INFO,
          referenceId: competency.id,
          referenceType: 'BEDSIDE_AUDIT_REQUEST',
        });
      } catch (e) {
        // Continue notifying remaining managers
      }
    }

    return competency;
  }

  async create(
    createCompetencyDto: CreateCompetencyDto,
  ) {
    const staff = await this.prisma.staff.findUnique({
      where: {
        id: createCompetencyDto.staffId,
      },
    });

    if (!staff) {
      throw new NotFoundException(
        'Staff not found',
      );
    }

    // If there was a pending audit request for this competency and staff, update it instead of creating a duplicate
    const existingPending = await this.prisma.competency.findFirst({
      where: {
        staffId: createCompetencyDto.staffId,
        name: createCompetencyDto.name,
        level: 'PENDING',
      },
    });

    let competency;
    if (existingPending) {
      competency = await this.prisma.competency.update({
        where: { id: existingPending.id },
        data: {
          level: createCompetencyDto.level,
          achievedOn: new Date(createCompetencyDto.achievedOn),
          expiresOn: createCompetencyDto.expiresOn ? new Date(createCompetencyDto.expiresOn) : null,
          assessorNotes: createCompetencyDto.assessorNotes,
          signature: createCompetencyDto.signature,
          evidenceUrl: createCompetencyDto.evidenceUrl,
          checklist: createCompetencyDto.checklist ?? undefined,
        },
        include: {
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  status: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });
    } else {
      competency = await this.prisma.competency.create({
        data: {
          name: createCompetencyDto.name,
          level: createCompetencyDto.level,
          achievedOn: new Date(
            createCompetencyDto.achievedOn,
          ),
          expiresOn:
            createCompetencyDto.expiresOn
              ? new Date(
                  createCompetencyDto.expiresOn,
                )
              : null,
          staffId:
            createCompetencyDto.staffId,
          assessorNotes: createCompetencyDto.assessorNotes,
          signature: createCompetencyDto.signature,
          evidenceUrl: createCompetencyDto.evidenceUrl,
          checklist: createCompetencyDto.checklist ?? undefined,
        },
        include: {
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  status: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });
    }

    // Send notification to the staff member
    if (staff.userId) {
      try {
        const formattedName = createCompetencyDto.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        await this.notificationsService.create({
          userId: staff.userId,
          title: `Bedside Audit Completed: ${formattedName}`,
          message: `Your bedside observation check for ${formattedName} has been signed off with result: ${createCompetencyDto.level}.`,
          type: createCompetencyDto.level === 'PASS' ? NotificationType.SUCCESS : NotificationType.WARNING,
          referenceId: competency.id,
          referenceType: 'BEDSIDE_AUDIT_COMPLETED',
        });
      } catch (err) {
        // Keep going
      }
    }

    return competency;
  }

  async findAll(query: CompetencyQueryDto) {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.CompetencyWhereInput = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              level: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              staff: {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    employeeNo: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    user: {
                      email: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                ],
              },
            },
          ],
        }
      : {}),
    ...(query.staffId ? { staffId: query.staffId } : {}),
    ...(query.organizationId ? { staff: { organizationId: query.organizationId } } : {}),
  };

  const [data, total] =
    await this.prisma.$transaction([
      this.prisma.competency.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
        include: {
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.competency.count({
        where,
      }),
    ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(id: string) {
    const competency =
      await this.prisma.competency.findUnique({
        where: {
          id,
        },
        include: {
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  status: true,
                },
              },
            },
          },
        },
      });

    if (!competency) {
      throw new NotFoundException(
        'Competency not found',
      );
    }

    return competency;
  }

  async update(
    id: string,
    updateCompetencyDto: UpdateCompetencyDto,
  ) {
    await this.findOne(id);

    const data: Prisma.CompetencyUpdateInput =
      {};

    if (updateCompetencyDto.name) {
      data.name =
        updateCompetencyDto.name;
    }

    if (updateCompetencyDto.level) {
      data.level =
        updateCompetencyDto.level;
    }

    if (updateCompetencyDto.achievedOn) {
      data.achievedOn = new Date(
        updateCompetencyDto.achievedOn,
      );
    }

    if (
      updateCompetencyDto.expiresOn !==
      undefined
    ) {
      data.expiresOn =
        updateCompetencyDto.expiresOn
          ? new Date(
              updateCompetencyDto.expiresOn,
            )
          : null;
    }

    if (updateCompetencyDto.assessorNotes !== undefined) {
      data.assessorNotes = updateCompetencyDto.assessorNotes;
    }

    if (updateCompetencyDto.signature !== undefined) {
      data.signature = updateCompetencyDto.signature;
    }

    if (updateCompetencyDto.evidenceUrl !== undefined) {
      data.evidenceUrl = updateCompetencyDto.evidenceUrl;
    }

    if (updateCompetencyDto.checklist !== undefined) {
      data.checklist = updateCompetencyDto.checklist ?? undefined;
    }

    return this.prisma.competency.update({
      where: {
        id,
      },
      data,
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.competency.delete({
      where: {
        id,
      },
    });
  }
}