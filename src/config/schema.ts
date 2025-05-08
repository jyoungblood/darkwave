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

  // Content tables
  calendar: {
    id: number;
    uuid: string;
    created_at: Date;
    approved_at: Date | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    host: string | null;
    datetime_start: Date | null;
    datetime_end: Date | null;
    venue_name: string | null;
    venue_address: string | null;
    venue_city: string | null;
    venue_state: string | null;
    venue_country: string | null;
    venue_zip: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    contact_url: string | null;
    uuid_submitted: string | null;
    uuid_approved: string | null;
    src: string | null;
    user_id: string | null;
    deleted_at: Date | null;
    photo_url: string | null;
    slug: string | null;
    updated_at: Date | null;
    photo_url_parameters: string | null;
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

  listings: {
    id: number;
    uuid: string;
    created_at: Date;
    horse_id: string | null;
    user_id: string | null;
    listing_type: string | null;
    title: string | null;
    subtitle: string | null;
    breeding_fee: string | null;
    booking_fee: string | null;
    chute_fee: string | null;
    addl_fees: string | null;
    yn_breeding_fee: boolean | null;
    yn_booking_fee: boolean | null;
    yn_chute_fee: boolean | null;
    yn_addl_fees: boolean | null;
    semen_cooled_info: string | null;
    semen_frozen_info: string | null;
    intl_shipping_info: string | null;
    yn_semen_cooled: boolean | null;
    yn_semen_frozen: boolean | null;
    yn_intl_shipping: boolean | null;
    updated_at: Date | null;
    expires_at: Date | null;
    paid_at: Date | null;
    approved_at: Date | null;
    private_treaty: boolean | null;
    availability_start: Date | null;
    availability_end: Date | null;
    deleted_at: Date | null;
    photo_url: string | null;
    slug: string | null;
    photo_url_parameters: string | null;
  };

  news: {
    id: number;
    uuid: string;
    created_at: Date;
    approved_at: Date | null;
    user_id: string | null;
    title: string | null;
    subtitle: string | null;
    datetime_published: Date | null;
    byline: string | null;
    url_original: string | null;
    body: string | null;
    deleted_at: Date | null;
    photo_url: string | null;
    slug: string | null;
    updated_at: Date | null;
    photo_url_parameters: string | null;
  };

  professionals: {
    id: number;
    uuid: string;
    created_at: Date;
    approved_at: Date | null;
    user_id: string | null;
    title: string | null;
    description: string | null;
    deleted_at: Date | null;
    photo_url: string | null;
    slug: string | null;
    updated_at: Date | null;
    photo_url_parameters: string | null;
  };

  ranches: {
    id: number;
    uuid: string;
    created_at: Date;
    title: string | null;
    approved_at: Date | null;
    subtitle: string | null;
    url_website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zip: string | null;
    photo_url: string | null;
    phone: string | null;
    email: string | null;
    description: string | null;
    user_id: string | null;
    deleted_at: Date | null;
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