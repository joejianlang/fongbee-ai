// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User Types
export interface UserWithoutPassword {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN';
  city?: string;
  avatar?: string;
}

// Service Types
export interface ServiceWithProvider {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  averageRating: number;
  totalReviews: number;
  serviceProvider: {
    id: string;
    businessName: string;
    avatar?: string;
    isVerified: boolean;
  };
}

// Order Types
export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  serviceType: string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
}

// Payment Types
export interface PaymentIntentResponse {
  stripeIntentId: string;
  stripeClientSecret: string;
  status: string;
}

// Custom Request Types
export interface CustomRequestDetail {
  id: string;
  requestNumber: string;
  status: string;
  formResponses: Record<string, any>;
  bids: BidInfo[];
}

export interface BidInfo {
  id: string;
  amount: number;
  estimatedDuration?: string;
  proposal?: string;
  status: string;
  serviceProvider: {
    id: string;
    businessName: string;
    averageRating: number;
  };
}

// Project & Contract Types
export interface ProjectDetail {
  id: string;
  projectNumber: string;
  title: string;
  description: string;
  status: string;
  totalProjectValue: number;
  milestones: MilestoneInfo[];
}

export interface MilestoneInfo {
  id: string;
  milestoneNumber: number;
  title: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
}

export interface ContractVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  title: string;
  content: string;
  status: string;
  customerSignedAt?: string;
  providerSignedAt?: string;
  createdAt: string;
  createdBy: string;
}

// Forum Types
export interface PostDetail {
  id: string;
  title?: string;
  content: string;
  author: {
    id: string;
    firstName?: string;
    avatar?: string;
  };
  geoTag: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  comments?: CommentInfo[];
}

export interface CommentInfo {
  id: string;
  content: string;
  author: {
    id: string;
    firstName?: string;
  };
  likeCount: number;
  createdAt: string;
}

// Article Types
export interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  summary?: string;
  summaryZh?: string;
  author?: string;
  sourceUrl: string;
  publishedAt: string;
  tags: string[];
  sentiment?: string;
  viewCount: number;
  likeCount: number;
}

// ─── Dynamic Form Builder Types ───────────────────────────────────────────────

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'chips'
  | 'multichips'
  | 'date';

export interface FormFieldDef {
  id: string;
  categoryId: string;
  fieldType: FormFieldType;
  fieldKey: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];    // parsed from optionsJson
  displayOrder: number;
}

export interface FormTemplateDef {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categoryIcon?: string;
  categoryColor?: string;
  fields: FormFieldDef[];
}

export interface ServiceCategoryDef {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  _count?: { formFields: number };
}

// ─── Payment Policy Types ──────────────────────────────────────────────────
export interface PaymentPolicyDetail {
  id: string;
  serviceType: string;
  serviceCategoryId?: string;
  autoCaptureHoursBefore: number;
  isAutoCaptureEnabled: boolean;
  cancellationCutoffHours: number;
  forfeiturePercentage: number;
  depositPercentage?: number;
  refundDays: number;
}
