// Database Schema

export interface Database {

  // DW default tables

  links: {
    id: number;
    uuid: string;
    created_at: Date;
    approved_at: Date | null;
    user_id: string | null;
    title: string | null;
    url: string | null;
    description: string | null;
    type: string | null;
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

  auth_roles: {
    id: number;
    name: string;
    description: string | null;
    created_at: Date;
  };

  rel_users_roles: {
    user_id: string;
    role_id: number;
    created_at: Date;
  };


  // Better-auth default tables
  
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
    name: string | null;
    first_name: string | null;
    last_name: string | null;
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