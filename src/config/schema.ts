// Database Schema

export interface Database {

  horses: {
    id: number;
    uuid: string;
    created_at: Date;
    updated_at: Date | null;
    name: string | null;
    admin_notes: string | null;
    photo_url: string | null;
    foal_year: number | null;
    color: string | null;
    breed: string | null;
    horse_type: string | null;
    sex: string | null;
    height: number | null;
    slug: string | null;
    visible_public: boolean | null;
    visible_seo: boolean | null;
    url_website: string | null;
    url_video: string | null;
    description: string | null;
    performance_record: string | null;
    deleted_at: Date | null;
    is_deleted: boolean | null;
    alt_photo_url: string | null;
    is_visible: boolean | null;
    photo_url_parameters: string | null;
    alt_photo_url_parameters: string | null;
  };

  rel_horses_pedigrees: {
    id: number;
    created_at: Date;
    horse_id: string | null;
    sire_1_id: string | null;
    sire_2_id: string | null;
    sire_3_id: string | null;
    sire_4_id: string | null;
    sire_5_id: string | null;
    sire_6_id: string | null;
    sire_7_id: string | null;
    dam_1_id: string | null;
    dam_2_id: string | null;
    dam_3_id: string | null;
    dam_4_id: string | null;
    dam_5_id: string | null;
    dam_6_id: string | null;
    dam_7_id: string | null;
    sire_1_name: string | null;
    sire_2_name: string | null;
    sire_3_name: string | null;
    sire_4_name: string | null;
    sire_5_name: string | null;
    sire_6_name: string | null;
    sire_7_name: string | null;
    dam_1_name: string | null;
    dam_2_name: string | null;
    dam_3_name: string | null;
    dam_4_name: string | null;
    dam_5_name: string | null;
    dam_6_name: string | null;
    dam_7_name: string | null;
  };

  rel_horses_users: {
    id: number;
    created_at: Date;
    user_id: string | null;
    horse_id: string | null;
    role: string | null;
  };

  rel_users_roles: {
    user_id: string;
    role_id: number;
    created_at: Date;
  };


  gallery_content: {
    id: number;
    uuid: string;
    created_at: Date;
    updated_at: Date | null;
    photo_url: string | null;
    gallery_type: string | null;
    display_order: number | null;
    title: string | null;
    description: string | null;
    related_id: string | null;
    related_table: string | null;
    user_id: string | null;
    photo_url_parameters: string | null;
  };

  links: {
    id: number;
    uuid: string;
    created_at: Date;
    approved_at: Date | null;
    user_id: string | null;
    title: string | null;
    url: string | null;
    description: string | null;
    deleted_at: Date | null;
    photo_url: string | null;
    slug: string | null;
    updated_at: Date | null;
    photo_url_parameters: string | null;
  };


  // Auth tables
  account: {
    id: string;
    accountId: string;
    providerId: string;
    userId: string;
    accessToken: string | null;
    refreshToken: string | null;
    idToken: string | null;
    accessTokenExpiresAt: Date | null;
    refreshTokenExpiresAt: Date | null;
    scope: string | null;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  auth_roles: {
    id: number;
    name: string;
    description: string | null;
    created_at: Date;
  };

  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
  };

  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  verification: {
    id: string;
    identifier: string;
    value: string;
    expiresAt: Date;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

} 