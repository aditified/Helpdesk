import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface SeedITicketMessage {
  id: string;
  senderType: string;
  senderName: string;
  senderUsername?: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
  isAiGenerated?: boolean;
  aiConfidence?: number;
}

interface SeedITicket {
  id: string;
  channel: string;
  username: string;
  displayName: string;
  subject?: string;
  avatar: string;
  bio?: string;
  followerCount?: number;
  isVerified?: boolean;
  connectedSince?: string;
  profileUrl?: string;
  category: string;
  priority: string;
  status: string;
  aiStatus: string;
  aiConfidence?: number;
  aiSummary?: string;
  suggestedReply?: string;
  sentiment?: string;
  unread: boolean;
  escalationReason?: string;
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  messages: SeedITicketMessage[];
}

const seedITickets: SeedITicket[] = [
  {
    id: "ig-101",
    channel: "instagram",
    username: "rahulsharma",
    displayName: "Rahul Sharma",
    subject: "Admission document requirements checklist",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    bio: "Tech student & aspiring engineer 🚀 Delhi, India",
    followerCount: 1420,
    isVerified: false,
    connectedSince: "2026-08-15",
    profileUrl: "https://instagram.com/rahulsharma",
    category: "admission",
    priority: "medium",
    status: "resolved",
    aiStatus: "ai_resolved",
    aiConfidence: 96,
    aiSummary: "Customer inquired about mandatory documents for undergraduate admission. AI assistant provided the complete checklist (Class 10/12 marksheets, ID proof, transfer certificate) and verified online submission workflow. Customer confirmed satisfaction and issue was auto-resolved.",
    suggestedReply: "Hi Rahul, your admission documents have been verified. You can proceed with the fee payment portal anytime before October 15.",
    sentiment: "positive",
    unread: false,
    lastMessage: "Yes, you can submit scanned PDF copies directly via the online portal.",
    lastMessageAt: new Date("2026-10-08T09:42:00Z"),
    createdAt: new Date("2026-10-08T09:30:00Z"),
    updatedAt: new Date("2026-10-08T09:42:00Z"),
    messages: [
      {
        id: "msg-101-1",
        senderType: "customer",
        senderName: "Rahul Sharma",
        senderUsername: "rahulsharma",
        senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        text: "What documents are required for admission?",
        timestamp: new Date("2026-10-08T09:30:00Z"),
      },
      {
        id: "msg-101-2",
        senderType: "ai",
        senderName: "AI Assistant",
        text: "Hello Rahul! For undergraduate admission, you will need:\n1. 10th and 12th Grade Marksheets (Original & Self-attested copies)\n2. Government ID Proof (Aadhaar Card or Passport)\n3. Transfer / Migration Certificate\n4. Recent passport-size photographs (minimum 4)\n5. Caste / Category certificate (if applicable).\n\nLet me know if you are applying for domestic or international quota!",
        timestamp: new Date("2026-10-08T09:31:00Z"),
        isAiGenerated: true,
        aiConfidence: 98,
      },
      {
        id: "msg-101-3",
        senderType: "customer",
        senderName: "Rahul Sharma",
        senderUsername: "rahulsharma",
        senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        text: "Can I submit them online or do I have to visit the campus?",
        timestamp: new Date("2026-10-08T09:38:00Z"),
      },
      {
        id: "msg-101-4",
        senderType: "ai",
        senderName: "AI Assistant",
        text: "Yes, you can submit scanned PDF copies directly via the online admission portal! In-person physical verification is only conducted during orientation week.",
        timestamp: new Date("2026-10-08T09:39:00Z"),
        isAiGenerated: true,
        aiConfidence: 96,
      },
      {
        id: "msg-101-5",
        senderType: "customer",
        senderName: "Rahul Sharma",
        senderUsername: "rahulsharma",
        senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        text: "Got it, that clarifies everything. Thanks so much!",
        timestamp: new Date("2026-10-08T09:41:00Z"),
      },
      {
        id: "msg-101-6",
        senderType: "ai",
        senderName: "AI Assistant",
        text: "You're very welcome! If you have any further questions, we're here to help. Have a great day!",
        timestamp: new Date("2026-10-08T09:42:00Z"),
        isAiGenerated: true,
        aiConfidence: 99,
      },
    ],
  },
  {
    id: "ig-102",
    channel: "instagram",
    username: "priyapatel",
    displayName: "Priya Patel",
    subject: "Unable to reset my password",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    bio: "Product designer & avid reader 📚 Mumbai",
    followerCount: 3820,
    isVerified: true,
    connectedSince: "2026-07-22",
    profileUrl: "https://instagram.com/priyapatel",
    category: "account",
    priority: "high",
    status: "open",
    aiStatus: "ai_suggested",
    aiConfidence: 89,
    aiSummary: "User is locked out and unable to trigger the password reset email for her student portal account. AI identified rate limiting on the reset endpoint and generated a secure one-time unlock link proposal awaiting admin approval.",
    suggestedReply: "Hi Priya, I reviewed your account (@priyapatel) and unblocked the temporary rate-limit. A fresh password reset link has just been dispatched to your registered email ending in ...@gmail.com. Please check your spam folder as well!",
    sentiment: "frustrated",
    unread: true,
    lastMessage: "I'm unable to reset my password. It keeps saying 'Too many attempts try again later' since morning.",
    lastMessageAt: new Date("2026-10-08T10:14:00Z"),
    createdAt: new Date("2026-10-08T10:10:00Z"),
    updatedAt: new Date("2026-10-08T10:14:00Z"),
    messages: [
      {
        id: "msg-102-1",
        senderType: "customer",
        senderName: "Priya Patel",
        senderUsername: "priyapatel",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        text: "I'm unable to reset my password. It keeps saying 'Too many attempts try again later' since morning. I have an assignment due tonight!",
        timestamp: new Date("2026-10-08T10:14:00Z"),
      },
    ],
  },
  {
    id: "ig-103",
    channel: "instagram",
    username: "amanshah",
    displayName: "Aman Shah",
    subject: "Fee refund request for duplicate charge",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    bio: "Finance enthusiast | Founder @ShahMedia",
    followerCount: 890,
    isVerified: false,
    connectedSince: "2026-09-01",
    profileUrl: "https://instagram.com/amanshah",
    category: "fees",
    priority: "high",
    status: "open",
    aiStatus: "escalated",
    aiConfidence: 62,
    aiSummary: "Customer requested a fee refund of $450 for double charge on semester tuition registration. Automatic processing halted due to institutional policy requiring human finance officer authorization for refunds above $100.",
    suggestedReply: "Hello Aman, our finance team has logged your transaction ID #TXN-88291. We have initiated a reversal for the duplicate payment of $450, which typically reflects in 3-5 business days.",
    sentiment: "frustrated",
    unread: true,
    escalationReason: "Refund amount ($450) exceeds autonomous refund threshold. Financial audit clearance required.",
    lastMessage: "Can I get a refund? I was charged twice for the registration fee and my bank confirmed both went through.",
    lastMessageAt: new Date("2026-10-08T08:50:00Z"),
    createdAt: new Date("2026-10-08T08:45:00Z"),
    updatedAt: new Date("2026-10-08T08:50:00Z"),
    messages: [
      {
        id: "msg-103-1",
        senderType: "customer",
        senderName: "Aman Shah",
        senderUsername: "amanshah",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        text: "Can I get a refund? I was charged twice for the registration fee and my bank confirmed both went through.",
        timestamp: new Date("2026-10-08T08:45:00Z"),
      },
      {
        id: "msg-103-2",
        senderType: "ai",
        senderName: "AI Assistant",
        text: "I understand that duplicate charges are frustrating, Aman. Could you please share the transaction reference numbers or a screenshot of the payment receipt so I can verify this with our billing ledger?",
        timestamp: new Date("2026-10-08T08:46:00Z"),
        isAiGenerated: true,
        aiConfidence: 91,
      },
      {
        id: "msg-103-3",
        senderType: "customer",
        senderName: "Aman Shah",
        senderUsername: "amanshah",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        text: "Transaction IDs are TXN-88291A and TXN-88291B, timestamped 10:12 AM and 10:14 AM yesterday. Total $450 duplicate.",
        timestamp: new Date("2026-10-08T08:50:00Z"),
      },
    ],
  },
  {
    id: "ig-104",
    channel: "instagram",
    username: "ananyagupta_",
    displayName: "Ananya Gupta",
    subject: "Mobile portal crashing when uploading documents",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    bio: "Design Researcher | Tech Geek 💻 Bangalore",
    followerCount: 2200,
    isVerified: false,
    connectedSince: "2026-06-10",
    profileUrl: "https://instagram.com/ananyagupta_",
    category: "technical_issue",
    priority: "urgent",
    status: "processing",
    aiStatus: "awaiting_reply",
    aiConfidence: 78,
    aiSummary: "User encountered repeated crashes when uploading portfolio PDFs on iOS 18 Safari. Workaround suggested (clearing cache or using desktop Chrome), waiting for customer test feedback.",
    suggestedReply: "Hi Ananya, our engineering team just deployed a patch (v2.4.1) addressing the mobile Safari upload buffer. Could you please test now?",
    sentiment: "neutral",
    unread: false,
    lastMessage: "I tried clearing the cache and it uploaded page 1, but then gave error code 413 on the full 15MB file.",
    lastMessageAt: new Date("2026-10-07T16:20:00Z"),
    createdAt: new Date("2026-10-07T15:10:00Z"),
    updatedAt: new Date("2026-10-07T16:20:00Z"),
    messages: [
      {
        id: "msg-104-1",
        senderType: "customer",
        senderName: "Ananya Gupta",
        senderUsername: "ananyagupta_",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        text: "Mobile portal is crashing when uploading documents for verification. Keeps showing blank white screen.",
        timestamp: new Date("2026-10-07T15:10:00Z"),
      },
      {
        id: "msg-104-2",
        senderType: "agent",
        senderName: "David Miller (Staff)",
        text: "Hi Ananya, sorry for the hassle! Could you check if your PDF file exceeds 10MB? Our mobile uploader currently enforces a 10MB limit per file.",
        timestamp: new Date("2026-10-07T15:35:00Z"),
      },
      {
        id: "msg-104-3",
        senderType: "customer",
        senderName: "Ananya Gupta",
        senderUsername: "ananyagupta_",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        text: "I tried clearing the cache and it uploaded page 1, but then gave error code 413 on the full 15MB file.",
        timestamp: new Date("2026-10-07T16:20:00Z"),
      },
    ],
  },
  {
    id: "ig-105",
    channel: "instagram",
    username: "vikram_m",
    displayName: "Vikram Malhotra",
    subject: "Student affairs office hours inquiry",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    bio: "Sports enthusiast | Student Council Member",
    followerCount: 650,
    isVerified: false,
    connectedSince: "2026-05-19",
    profileUrl: "https://instagram.com/vikram_m",
    category: "general_query",
    priority: "low",
    status: "closed",
    aiStatus: "ai_resolved",
    aiConfidence: 99,
    aiSummary: "User requested office hours for student affairs this week. AI answered with current schedule (Mon-Fri 9:00 AM - 5:30 PM, closed Saturday for maintenance). Issue marked closed after customer acknowledged.",
    suggestedReply: "Hi Vikram, Student Affairs office hours are 9:00 AM - 5:30 PM weekdays.",
    sentiment: "positive",
    unread: false,
    lastMessage: "Perfect, thank you! I will stop by tomorrow morning at 10 AM.",
    lastMessageAt: new Date("2026-10-06T14:12:00Z"),
    createdAt: new Date("2026-10-06T14:05:00Z"),
    updatedAt: new Date("2026-10-06T14:12:00Z"),
    messages: [
      {
        id: "msg-105-1",
        senderType: "customer",
        senderName: "Vikram Malhotra",
        senderUsername: "vikram_m",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
        text: "What are the office hours for student affairs this week?",
        timestamp: new Date("2026-10-06T14:05:00Z"),
      },
      {
        id: "msg-105-2",
        senderType: "ai",
        senderName: "AI Assistant",
        text: "Hi Vikram! The Student Affairs office is open Monday through Friday from 9:00 AM to 5:30 PM in Building C, Room 204. Please note the desk will close at 1:00 PM this Friday for a staff development session.",
        timestamp: new Date("2026-10-06T14:06:00Z"),
        isAiGenerated: true,
        aiConfidence: 99,
      },
      {
        id: "msg-105-3",
        senderType: "customer",
        senderName: "Vikram Malhotra",
        senderUsername: "vikram_m",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
        text: "Perfect, thank you! I will stop by tomorrow morning at 10 AM.",
        timestamp: new Date("2026-10-06T14:12:00Z"),
      },
    ],
  },
  {
    id: "ig-106",
    channel: "instagram",
    username: "sneharao.official",
    displayName: "Sneha Rao",
    subject: "Delayed course enrollment confirmation email",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    bio: "Classical dancer & MBA candidate 🎓",
    followerCount: 5400,
    isVerified: true,
    connectedSince: "2026-04-03",
    profileUrl: "https://instagram.com/sneharao.official",
    category: "complaint",
    priority: "medium",
    status: "processing",
    aiStatus: "human_replied",
    aiConfidence: 85,
    aiSummary: "Student complained regarding delayed course enrollment confirmation email for 3 days. Agent escalated to Registrar desk and manually re-sent confirmation PDF via Instagram DM.",
    suggestedReply: "Hi Sneha, our Registrar has verified your seat allocation. The official enrolment letter is attached to your student dashboard now.",
    sentiment: "neutral",
    unread: false,
    lastMessage: "I've forwarded your student ID directly to the Registrar's priority queue and attached your provisional seat confirmation here.",
    lastMessageAt: new Date("2026-10-06T11:45:00Z"),
    createdAt: new Date("2026-10-06T09:15:00Z"),
    updatedAt: new Date("2026-10-06T11:45:00Z"),
    messages: [
      {
        id: "msg-106-1",
        senderType: "customer",
        senderName: "Sneha Rao",
        senderUsername: "sneharao.official",
        senderAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
        text: "I have been waiting for my course confirmation email for 3 days. My payment went through on Monday but still no response.",
        timestamp: new Date("2026-10-06T09:15:00Z"),
      },
      {
        id: "msg-106-2",
        senderType: "agent",
        senderName: "Sarah Jenkins (Support Lead)",
        text: "Hi Sneha, thank you for checking in. I've forwarded your student ID directly to the Registrar's priority queue and attached your provisional seat confirmation here.",
        timestamp: new Date("2026-10-06T11:45:00Z"),
      },
    ],
  },
];

async function seed() {
  console.log("Seeding i-tickets into PostgreSQL...");
  for (const t of seedITickets) {
    const { messages, ...ticketData } = t;

    await prisma.iTicket.upsert({
      where: { id: t.id },
      update: ticketData,
      create: ticketData,
    });

    for (const msg of messages) {
      await prisma.iTicketMessage.upsert({
        where: { id: msg.id },
        update: {
          ticketId: t.id,
          senderType: msg.senderType,
          senderName: msg.senderName,
          senderUsername: msg.senderUsername,
          senderAvatar: msg.senderAvatar,
          text: msg.text,
          timestamp: msg.timestamp,
          isAiGenerated: msg.isAiGenerated ?? false,
          aiConfidence: msg.aiConfidence,
        },
        create: {
          id: msg.id,
          ticketId: t.id,
          senderType: msg.senderType,
          senderName: msg.senderName,
          senderUsername: msg.senderUsername,
          senderAvatar: msg.senderAvatar,
          text: msg.text,
          timestamp: msg.timestamp,
          isAiGenerated: msg.isAiGenerated ?? false,
          aiConfidence: msg.aiConfidence,
        },
      });
    }
  }
  console.log(`Successfully seeded ${seedITickets.length} i-tickets into PostgreSQL!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed i-tickets:", err);
  process.exit(1);
});
