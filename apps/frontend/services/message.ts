import { api } from "@/lib/axios";

export interface SendMessageDto {
  receiverId: string;
  message: string;
  messageType?: string;
  courseTitle?: string;
  expiryDate?: string;
  statusType?: string;
}

export interface SendWarningDto {
  staffId: string;
  courseTitle: string;
  expiryDate: string;
  statusType: "EXPIRED" | "EXPIRING";
  customNote?: string;
  sendEmail?: boolean;
  sendNotification?: boolean;
  sendChat?: boolean;
}

export const messageService = {
  getConversations() {
    return api.get("/messages/conversations");
  },

  getMessages(otherUserId: string) {
    return api.get(`/messages/${otherUserId}`);
  },

  sendMessage(dto: SendMessageDto) {
    return api.post("/messages", dto);
  },

  sendWarning(dto: SendWarningDto) {
    return api.post("/messages/send-warning", dto);
  },

  getUnreadCount() {
    return api.get("/messages/unread-count");
  },
};
