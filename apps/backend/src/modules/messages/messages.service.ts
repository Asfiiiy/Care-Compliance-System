import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendWarningDto } from './dto/send-warning.dto';
import { NotificationType, NotificationStatus, UserRole } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Get list of conversations for current user
   */
  async getConversations(currentUser: any) {
    const userId = currentUser.sub;
    const role = currentUser.role;
    const organizationId = currentUser.organizationId;

    if (role === UserRole.STAFF) {
      // Find managers in the same organization
      const managers = await this.prisma.user.findMany({
        where: {
          ...(organizationId ? { organizationId } : {}),
          role: { in: [UserRole.MANAGER, UserRole.ADMIN] },
          status: 'ACTIVE',
        },
        include: {
          staff: true,
          organization: true,
        },
      });

      const conversations = await Promise.all(
        managers.map(async (mgr) => {
          if (!mgr.id) return null;

          const lastMessage = await this.prisma.chatMessage.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: mgr.id },
                { senderId: mgr.id, receiverId: userId },
              ],
            },
            orderBy: { createdAt: 'desc' },
          });

          if (!lastMessage) {
            return null;
          }

          const unreadCount = await this.prisma.chatMessage.count({
            where: {
              senderId: mgr.id,
              receiverId: userId,
              read: false,
            },
          });

          const mgrName = mgr.staff
            ? `${mgr.staff.firstName} ${mgr.staff.lastName}`
            : mgr.role === UserRole.ADMIN
              ? 'System Administrator'
              : 'Registered Manager';

          const mgrDesignation =
            mgr.role === UserRole.ADMIN
              ? 'Compliance Auditor (Admin)'
              : 'Registered Care Manager';

          return {
            user: {
              id: mgr.id,
              email: mgr.email,
              role: mgr.role,
              name: mgrName,
              avatarUrl: mgr.staff?.avatarUrl || null,
              designation: mgrDesignation,
              jobTitle: mgrDesignation,
              department: mgr.organization?.name || 'Care Home Management',
              isManager: true,
            },
            lastMessage,
            unreadCount,
          };
        }),
      );

      const activeOnly = conversations.filter((c): c is NonNullable<typeof c> => c !== null);
      return activeOnly.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    // Role is MANAGER or ADMIN -> List staff with active messages / warnings in this organization
    const staffList = await this.prisma.staff.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        user: true,
        trainings: true,
        certificates: true,
        competencies: true,
      },
      orderBy: { firstName: 'asc' },
    });

    const conversations = await Promise.all(
      staffList.map(async (st) => {
        const staffUserId = st.userId;
        if (!staffUserId) return null;

        const lastMessage = await this.prisma.chatMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: staffUserId },
              { senderId: staffUserId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        // ONLY keep if there is an active notice / message exchanged
        if (!lastMessage) {
          return null;
        }

        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            senderId: staffUserId,
            receiverId: userId,
            read: false,
          },
        });

        // Compute staff compliance score
        const now = new Date();
        const allItems = [...(st.trainings || []), ...(st.certificates || [])];
        const validCount = allItems.filter(
          (t: any) => (!t.expiresOn && !t.expiryDate) || new Date(t.expiresOn || t.expiryDate) > now,
        ).length;
        const passedComps = (st.competencies || []).filter((c: any) => c.level === 'PASS').length;
        const totalItems = allItems.length + (st.competencies?.length || 0);
        const complianceScore = totalItems > 0 ? Math.round(((validCount + passedComps) / totalItems) * 100) : 100;

        const expiredCount = allItems.filter(
          (t: any) => (t.expiresOn || t.expiryDate) && new Date(t.expiresOn || t.expiryDate) < now,
        ).length;

        const staffRole = st.user?.role || 'STAFF';
        const staffDesignation = staffRole === 'MANAGER' ? 'Registered Manager' : 'Care Assistant';

        return {
          user: {
            id: staffUserId,
            staffId: st.id,
            email: st.user?.email || '',
            role: staffRole,
            name: `${st.firstName} ${st.lastName}`,
            avatarUrl: st.avatarUrl,
            jobTitle: staffDesignation,
            designation: staffDesignation,
            department: 'Care & Nursing',
            employeeNo: st.employeeNo,
            complianceScore,
            expiredCount,
            isStaff: true,
          },
          lastMessage,
          unreadCount,
        };
      }),
    );

    // Filter to ONLY staff members with active conversations/notices (no unnecessary empty contacts)
    const activeConversations = conversations.filter((c): c is NonNullable<typeof c> => c !== null);

    // Sort: conversations with newest messages first
    return activeConversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  /**
   * Get full message thread with a specific user & mark as read
   */
  async getMessages(currentUserId: string, otherUserId: string) {
    // Mark received messages from this user as read
    await this.prisma.chatMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            staff: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Send a direct chat message
   */
  async sendMessage(senderId: string, senderOrgId: string | null, dto: SendMessageDto) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
      include: { staff: true },
    });

    if (!receiver) {
      throw new NotFoundException('Recipient user not found');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        message: dto.message,
        messageType: dto.messageType || 'TEXT',
        courseTitle: dto.courseTitle || null,
        expiryDate: dto.expiryDate || null,
        statusType: dto.statusType || null,
        organizationId: senderOrgId || receiver.organizationId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            staff: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return message;
  }

  /**
   * Send a 3-Channel CQC Compliance Warning (Email + In-App Notification + Direct Chat)
   */
  async sendWarning(managerUser: any, dto: SendWarningDto) {
    // 1. Resolve staff & user record
    let staff = await this.prisma.staff.findUnique({
      where: { id: dto.staffId },
      include: { user: true },
    });

    if (!staff) {
      // Try resolving by userId
      staff = await this.prisma.staff.findUnique({
        where: { userId: dto.staffId },
        include: { user: true },
      });
    }

    if (!staff || !staff.user) {
      throw new NotFoundException('Staff profile or user account not found');
    }

    if (managerUser.role === UserRole.MANAGER && staff.organizationId !== managerUser.organizationId) {
      throw new ForbiddenException('You can only send warnings to staff within your care home');
    }

    const staffName = `${staff.firstName} ${staff.lastName}`;
    const staffEmail = staff.user.email;
    const isExpired = dto.statusType === 'EXPIRED';

    const results = {
      emailSent: false,
      notificationCreated: false,
      chatMessageSent: false,
    };

    // Channel 1: In-App Notification
    if (dto.sendNotification !== false) {
      const notifTitle = isExpired
        ? `🚨 CQC Mandatory Training Expired: ${dto.courseTitle}`
        : `⏰ CQC Training Renewal Notice: ${dto.courseTitle}`;

      const notifMessage = isExpired
        ? `Your "${dto.courseTitle}" certification has expired (${dto.expiryDate}). CQC Regulation 18 requires immediate renewal. Please upload fresh certificate evidence.`
        : `Your "${dto.courseTitle}" certification is expiring soon on ${dto.expiryDate}. Please complete refresher training before it lapses.`;

      await this.prisma.notification.create({
        data: {
          userId: staff.userId,
          title: notifTitle,
          message: notifMessage,
          type: isExpired ? NotificationType.ERROR : NotificationType.WARNING,
          status: NotificationStatus.UNREAD,
          referenceId: dto.courseTitle,
          referenceType: 'CQC_WARNING',
        },
      });
      results.notificationCreated = true;
    }

    // Channel 2: Formal Email Dispatch
    if (dto.sendEmail !== false) {
      try {
        await this.mailService.sendCqcWarningEmail(
          staffEmail,
          staffName,
          dto.courseTitle,
          dto.statusType,
          dto.expiryDate,
          dto.customNote,
        );
        results.emailSent = true;
      } catch (err: any) {
        console.warn(`[Mail Dispatch Warning] ${err.message}`);
      }
    }

    // Channel 3: Direct Chat Message Card
    if (dto.sendChat !== false) {
      const chatWarningText = isExpired
        ? `🚨 **CRITICAL CQC COMPLIANCE BREACH**\n\nYour mandatory **"${dto.courseTitle}"** certification has **EXPIRED** (${dto.expiryDate}).\n\nUnder CQC Regulation 18 (Staffing), you must complete refresher training and upload valid completion evidence immediately to maintain your care home compliance passport.`
        : `⏰ **UPCOMING TRAINING EXPIRATION NOTICE**\n\nYour **"${dto.courseTitle}"** certification is due to expire on **${dto.expiryDate}** (within 30 days).\n\nPlease complete your refresher module and upload your updated certificate before the deadline.`;

      const finalChatMessage = dto.customNote
        ? `${chatWarningText}\n\n💬 **Manager's Note:** "${dto.customNote}"`
        : chatWarningText;

      await this.prisma.chatMessage.create({
        data: {
          senderId: managerUser.sub,
          receiverId: staff.userId,
          message: finalChatMessage,
          messageType: 'WARNING',
          courseTitle: dto.courseTitle,
          expiryDate: dto.expiryDate,
          statusType: dto.statusType,
          organizationId: managerUser.organizationId || staff.organizationId,
        },
      });
      results.chatMessageSent = true;
    }

    return {
      success: true,
      message: `Compliance warning dispatched successfully to ${staffName}!`,
      details: results,
      staff: {
        id: staff.id,
        name: staffName,
        email: staffEmail,
      },
    };
  }

  /**
   * Get total unread messages count for current user
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.chatMessage.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    return { unreadCount: count };
  }
}
