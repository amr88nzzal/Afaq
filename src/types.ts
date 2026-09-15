export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export type DestinationCountry = 'uk' | 'australia' | 'new_zealand' | 'usa' | 'canada';

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
  officialEmail: boolean;
  whatsappAlerts: boolean;
  telegramAlerts: boolean;
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
  category: 'passport' | 'transcript' | 'english_test' | 'recommendation' | 'sop' | 'financial' | 'identity' | 'academic' | 'language' | 'financial_guarantee' | 'other' | string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'action_needed' | 'missing' | 'rejected';
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  rejectionReason?: string;
  feedback?: string;
  file_url?: string;
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
  studentWhatsapp?: string;
  countryOfResidence?: string;
  destination: DestinationCountry;
  countryId?: number;
  countryNameAr?: string;
  countryNameEn?: string;
  universityId?: number;
  universityName?: string;
  universityNameAr?: string;
  universityNameEn?: string;
  majorId?: number;
  majorNameAr?: string;
  majorNameEn?: string;
  courseName?: string;
  level?: StudyLevel;
  studyLevel?: string;
  intake?: string;
  intakeSeason?: string;
  sponsorType?: string;
  gpa?: string;
  status: ApplicationStage;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  counselorId?: string;
  counselorName?: string;
  counselorPhone?: string;
  scholarshipInterest?: boolean;
  documents?: DocumentItem[];
  timeline?: TimelineEvent[];
  notes?: string[] | string;
  portalPassword?: string;
  messages?: any[];
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
  id: string | number;
  name: string;
  nameAr: string;
  country: DestinationCountry | string;
  country_id?: number;
  country_name_ar?: string;
  country_name_en?: string;
  city: string;
  cityAr: string;
  image: string;
  image_url?: string;
  worldRank: number;
  ranking?: number;
  badgeAr: string;
  badgeEn: string;
  tuitionRange: string;
  cost_info?: string;
  intakes?: string[];
  scholarshipRate?: string;
  popularMajors?: string[];
  descriptionAr: string;
  descriptionEn: string;
  gccAccredited?: boolean;
  workRights?: string;
  acceptance_rate?: string;
  featured?: boolean;
  website_url?: string;
  majors?: MajorEntity[];
}

export interface CountryEntity {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  info_ar?: string;
  info_en?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface UniversityEntity {
  id: number;
  country_id: number;
  country_name_ar?: string;
  country_name_en?: string;
  name_ar: string;
  name_en: string;
  city_ar?: string;
  city_en?: string;
  details_ar?: string;
  details_en?: string;
  cost_info?: string;
  ranking?: number;
  acceptance_rate?: string;
  featured?: boolean;
  website_url?: string;
  image_url?: string;
  majors?: MajorEntity[];
}

export interface MajorEntity {
  id: number;
  university_id: number;
  university_name_ar?: string;
  name_ar: string;
  name_en: string;
  category?: string;
  degree_level?: string;
  duration?: string;
  annual_tuition?: string;
}

export interface StaffUserEntity {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'counselor' | 'editor' | 'staff';
  telegram_id?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CustomerEntity {
  id: number;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  nationality?: string;
  current_status?: string;
  applications_count?: number;
  applications?: any[];
  created_at?: string;
}

export interface MeetingEntity {
  id?: number;
  customer_id?: number;
  staff_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  destination_country?: string;
  topic?: string;
  meeting_date?: string;
  meeting_time: string;
  meeting_type?: 'video' | 'phone' | 'in_office';
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meeting_link?: string;
  notes?: string;
  counselor_name?: string;
}

export interface CMSParagraphEntity {
  id: number;
  slug: string;
  section_name?: string;
  title_ar?: string;
  title_en?: string;
  text_ar: string;
  text_en: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'counselor' | 'system';
  senderName: string;
  text: string;
  time: string;
  channel?: 'portal' | 'whatsapp' | 'telegram' | 'email';
}

export interface LogoProposalSymbol {
  symbolAr: string;
  symbolEn: string;
  meaningAr?: string;
  meaningEn?: string;
}

export interface LogoProposalColor {
  name: string;
  hex: string;
}

export interface LogoProposal {
  id: number;
  titleAr: string;
  titleEn: string;
  taglineAr: string;
  taglineEn: string;
  conceptType: 'emblem' | 'modern_minimal' | 'luxury_gold' | 'dynamic_wings' | 'iconic_portal';
  symbols: LogoProposalSymbol[];
  typographyAr?: string;
  typographyEn?: string;
  strengthsAr: string[];
  improvementsAr: string[];
  colorPalette: LogoProposalColor[];
  culturalAppealScore: number;
  recommendedFor: string;
  svgPreview?: string;
  bestUseFor?: string;
}
