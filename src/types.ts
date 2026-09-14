export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export type DestinationCountry = 'uk' | 'australia' | 'new_zealand';

export type StudyLevel = 'foundation' | 'bachelor' | 'master' | 'phd' | 'english_course';

export type ApplicationStage = 
  | 'submitted'
  | 'under_review'
  | 'sent_to_university'
  | 'conditional_offer'
  | 'unconditional_offer'
  | 'visa_processing'
  | 'visa_prep'
  | 'approved_ready'
  | 'enrolled';

export interface NotificationPreferences {
  officialEmail: boolean; // Primary official response channel
  whatsappAlerts: boolean; // Optional client choice
  telegramAlerts: boolean; // Optional client choice
  whatsappPhone?: string;
  telegramUsername?: string;
}

export interface ConciergeService {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'visa' | 'accommodation' | 'airport' | 'settlement' | 'translation';
  estimatedCostAr: string;
  estimatedCostEn: string;
  includedItemsAr: string[];
  includedItemsEn: string[];
  isPaidAfterAdmission: true;
}

export interface AdminAlert {
  id: string;
  applicationId: string;
  applicationNumber: string;
  studentName: string;
  studentPhone: string;
  destination: DestinationCountry;
  universityName: string;
  studyLevel: StudyLevel;
  timestamp: string;
  timeAgoAr: string;
  timeAgoEn: string;
  isRead: boolean;
  priority: 'urgent' | 'normal';
}

export interface DocumentItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'passport' | 'transcript' | 'english_test' | 'recommendation' | 'sop' | 'financial' | 'identity' | 'academic' | 'language' | 'financial_guarantee';
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'action_needed';
  fileName?: string;
  uploadedAt?: string;
  rejectionReason?: string;
}

export interface TimelineEvent {
  id?: string;
  stage: ApplicationStage;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  date?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Application {
  id: string;
  applicationNumber: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  countryOfResidence: string;
  destination: DestinationCountry;
  universityName: string;
  courseName: string;
  level: StudyLevel;
  intake: string;
  status: ApplicationStage;
  submittedAt: string;
  updatedAt: string;
  counselorId: string;
  counselorName: string;
  counselorPhone: string;
  scholarshipInterest: boolean;
  documents: DocumentItem[];
  timeline: TimelineEvent[];
  notes: string[];
  portalPassword?: string;
}

export interface Counselor {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  avatar: string;
  phone: string;
  telegramHandle: string;
  specialtyCountries: DestinationCountry[];
  rating: number;
  studentsPlaced: number;
  availableSlots: string[];
}

export interface University {
  id: string;
  name: string;
  nameAr: string;
  country: DestinationCountry;
  city: string;
  cityAr: string;
  image: string;
  worldRank: number;
  badgeAr: string;
  badgeEn: string;
  tuitionRange: string;
  intakes: string[];
  scholarshipRate: string;
  popularMajors: string[];
  descriptionAr: string;
  descriptionEn: string;
  gccAccredited: boolean;
  workRights: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'counselor' | 'system';
  senderName: string;
  text: string;
  time: string;
  channel?: 'portal' | 'whatsapp' | 'telegram' | 'email';
}

export interface LogoProposal {
  id: number;
  titleAr: string;
  titleEn: string;
  taglineAr: string;
  taglineEn: string;
  conceptType: 'emblem' | 'modern_minimal' | 'luxury_gold' | 'dynamic_wings' | 'iconic_portal';
  symbols: {
    symbolAr: string;
    symbolEn: string;
    meaningAr: string;
    meaningEn: string;
  }[];
  strengthsAr: string[];
  improvementsAr: string[];
  colorPalette: { name: string; hex: string }[];
  culturalAppealScore: number; // out of 10 for Gulf & Arab students
  recommendedFor: string;
}
