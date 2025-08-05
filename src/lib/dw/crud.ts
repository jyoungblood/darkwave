import type { AstroCookies } from 'astro';
import { validateCsrf } from "@/lib/csrf";
import { handlePhotoUpdates } from '@/lib/dw/bunny';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { formatMySQLDateTime } from '@/lib/dw/helpers';
import { checkAuthorizationWithOwnership } from '@/lib/auth/permissions';

interface PhotoData {
  [key: string]: string | null;
}

interface GenericRecord {
  [key: string]: any;
}

interface SaveOptions {
  table: string;
  recordData: Record<string, any>;
  newRecordData?: Record<string, any>; // Fields to only set on new records
  photoFields?: string[];
  requiredFields?: string[];
  responseFields?: string[];
  afterSave?: (params: {
    db: any,
    record: GenericRecord,
    formData: FormData,
    isNew: boolean
  }) => Promise<void>;
}

interface SaveResponse {
  success: boolean;
  uuid: string;
  slug: string;
  [key: string]: any;
}

interface DeleteOptions {
  table: string;
  afterDelete?: (params: {
    db: any,
    uuid: string
  }) => Promise<void>;
}

async function checkAuthorization(
  table: string,
  uuid: string | null,
  locals: App.Locals
): Promise<Response | null> {
  if (!locals.userId || !locals.authRoles) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Determine if ownership is required based on whether this is an update
  const requireOwnership = !!uuid;

  // Check authorization with ownership
  const authError = await checkAuthorizationWithOwnership(
    locals.userId,
    locals.authRoles,
    uuid ?? null, // Convert undefined to null
    table,
    requireOwnership,
    db
  );

  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null;
}

export async function handleSave(
  formData: FormData,
  request: Request,
  cookies: AstroCookies,
  locals: App.Locals,
  options: SaveOptions
) {
  try {
    await validateCsrf({ formData, cookies });
    const uuid = formData.get("uuid")?.toString();

    // Check authorization using locals
    const authCheck = await checkAuthorization(options.table, uuid ?? null, locals);
    if (authCheck) return authCheck;

    // Validate required fields
    if (options.requiredFields?.length) {
      const missingFields = options.requiredFields.filter(
        field => !options.recordData[field]
      );
      
      if (missingFields.length) {
        return new Response(
          JSON.stringify({ 
            error: `Required fields missing: ${missingFields.join(', ')}` 
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Prepare the data to be saved
    const dataToSave = { ...options.recordData };
    
    // If this is a new record and newRecordData is provided, merge it in
    if (!uuid && options.newRecordData) {
      Object.assign(dataToSave, options.newRecordData);
    }

    let record: GenericRecord;

    if (uuid) {
      // Update existing record using Kysely's query builder
      await db
        .updateTable(options.table as any)
        .set(dataToSave)
        .where('uuid', '=', uuid)
        .execute();
      
      // Fetch the updated record
      const result = await db
        .selectFrom(options.table as any)
        .selectAll()
        .where('uuid', '=', uuid)
        .executeTakeFirst();
      
      if (!result) {
        throw new Error(`Record with uuid ${uuid} not found after update`);
      }
      
      record = result as GenericRecord;
    } else {
      // Create new record with UUID
      const newUuid = uuidv4();
      
      // Add UUID to the data
      const insertData = {
        ...dataToSave,
        uuid: newUuid
      };
      
      // Insert using Kysely's query builder
      await db
        .insertInto(options.table as any)
        .values(insertData)
        .execute();
      
      // Fetch the newly created record
      const result = await db
        .selectFrom(options.table as any)
        .selectAll()
        .where('uuid', '=', newUuid)
        .executeTakeFirst();
      
      if (!result) {
        throw new Error(`Record with uuid ${newUuid} not found after insert`);
      }
      
      record = result as GenericRecord;
    }

    // Execute afterSave callback if provided
    if (options.afterSave) {
      await options.afterSave({
        db,
        record,
        formData,
        isNew: !uuid
      });
    }

    // Build response object with default fields
    const responseData: SaveResponse = {
      success: true,
      uuid: record.uuid,
      slug: record.slug,
    };

    // Add additional response fields if specified
    if (options.responseFields?.length) {
      options.responseFields.forEach(field => {
        responseData[field] = record[field];
      });
    }

    return new Response(
      JSON.stringify(responseData), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid CSRF token') {
      return new Response(JSON.stringify({
        error: 'Invalid request token. Please refresh the page and try again.'
      }), {
        status: 403
      });
    }
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleSoftDelete(
  request: Request,
  cookies: AstroCookies,
  locals: App.Locals,
  options: DeleteOptions
) {
  try {
    const { uuid } = await request.json();

    if (!uuid) {
      console.error("Validation failed - UUID is missing");
      return new Response(
        JSON.stringify({ error: "UUID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check authorization using locals
    const authCheck = await checkAuthorization(options.table, uuid, locals);
    if (authCheck) return authCheck;
    
    // Update record with deleted_at timestamp using Kysely's query builder
    await db
      .updateTable(options.table as any)
      .set({ deleted_at: formatMySQLDateTime() })
      .where('uuid', '=', uuid)
      .where('deleted_at', 'is', null)
      .execute();

    // Execute afterDelete callback if provided
    if (options.afterDelete) {
      await options.afterDelete({
        db,
        uuid
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Record successfully deleted"
      }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
