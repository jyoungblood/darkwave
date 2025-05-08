/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    isAuthenticated: boolean;
    email?: string;
    userId?: string;
    // DW
    authRoles: string[];
    rolesVersion: number;
  }
}