


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."authenticate_user"("input_email" "text", "input_password" "text") RETURNS TABLE("user_id" "text", "user_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check admins table
  RETURN QUERY
  SELECT id::text, 'ADMIN'::text
  FROM public.admins
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;
  
  -- Check doctors table
  RETURN QUERY
  SELECT id::text, 'DOCTOR'::text
  FROM public.doctors
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;
  
  -- Check vhvs table
  RETURN QUERY
  SELECT id::text, 'VHV'::text
  FROM public.vhvs
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;
  
  -- Check patients table
  RETURN QUERY
  SELECT id::text, 'PATIENT'::text
  FROM public.patients
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;
END;
$$;


ALTER FUNCTION "public"."authenticate_user"("input_email" "text", "input_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hash_password"("password" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Use bcrypt hashing with gen_salt
  RETURN crypt(password, gen_salt('bf', 8));
END;
$$;


ALTER FUNCTION "public"."hash_password"("password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_password"("password" "text", "hashed_password" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Verify password against hash
  RETURN crypt(password, hashed_password) = hashed_password;
END;
$$;


ALTER FUNCTION "public"."verify_password"("password" "text", "hashed_password" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "phone" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "scheduled_time" time without time zone NOT NULL,
    "appointment_type" "text" DEFAULT 'consultation'::"text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "appointments_appointment_type_check" CHECK (("appointment_type" = ANY (ARRAY['consultation'::"text", 'follow_up'::"text", 'emergency'::"text", 'routine'::"text"]))),
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "vhv_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assignments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doctors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "phone" "text",
    "license_number" "text" NOT NULL,
    "specialization" "text",
    "experience_years" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."doctors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emergency_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "vhv_id" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "description" "text" NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "acknowledged_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    CONSTRAINT "emergency_alerts_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "emergency_alerts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'acknowledged'::"text", 'resolved'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."emergency_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intake_submissions" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "vhv_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "intake_submissions_status_check" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'SUBMITTED'::"text", 'APPROVED'::"text", 'CHANGES_REQUESTED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."intake_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "dosage" "text" NOT NULL,
    "frequency" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "prescribed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "phone" "text",
    "national_id" "text",
    "dob" "date",
    "address" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "medical_history" "text",
    "allergies" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reschedule_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "new_date" "date" NOT NULL,
    "new_time" time without time zone NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "processed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reschedule_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."reschedule_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "vhv_id" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vhvs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "phone" "text",
    "license_number" "text" NOT NULL,
    "specialization" "text",
    "experience_years" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vhvs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "vhv_id" "uuid" NOT NULL,
    "visit_date" "date" NOT NULL,
    "visit_time" time without time zone NOT NULL,
    "visit_type" "text" DEFAULT 'routine'::"text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "visits_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "visits_visit_type_check" CHECK (("visit_type" = ANY (ARRAY['routine'::"text", 'follow_up'::"text", 'emergency'::"text", 'assessment'::"text"])))
);


ALTER TABLE "public"."visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vital_signs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "recorded_by" "uuid",
    "blood_pressure_systolic" integer,
    "blood_pressure_diastolic" integer,
    "heart_rate" integer,
    "temperature" numeric,
    "weight" numeric,
    "height" numeric,
    "oxygen_saturation" integer,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vital_signs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_patient_vhv_unique" UNIQUE ("patient_id", "vhv_id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doctors"
    ADD CONSTRAINT "doctors_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."doctors"
    ADD CONSTRAINT "doctors_license_number_key" UNIQUE ("license_number");



ALTER TABLE ONLY "public"."doctors"
    ADD CONSTRAINT "doctors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emergency_alerts"
    ADD CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intake_submissions"
    ADD CONSTRAINT "intake_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medications"
    ADD CONSTRAINT "medications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_national_id_key" UNIQUE ("national_id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reschedule_requests"
    ADD CONSTRAINT "reschedule_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vhvs"
    ADD CONSTRAINT "vhvs_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."vhvs"
    ADD CONSTRAINT "vhvs_license_number_key" UNIQUE ("license_number");



ALTER TABLE ONLY "public"."vhvs"
    ADD CONSTRAINT "vhvs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vital_signs"
    ADD CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_appointments_doctor_id" ON "public"."appointments" USING "btree" ("doctor_id");



CREATE INDEX "idx_appointments_patient_id" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_assignments_doctor_id" ON "public"."assignments" USING "btree" ("doctor_id");



CREATE INDEX "idx_assignments_patient_id" ON "public"."assignments" USING "btree" ("patient_id");



CREATE INDEX "idx_assignments_patient_vhv" ON "public"."assignments" USING "btree" ("patient_id", "vhv_id");



CREATE INDEX "idx_assignments_vhv_id" ON "public"."assignments" USING "btree" ("vhv_id");



CREATE INDEX "idx_emergency_alerts_patient_id" ON "public"."emergency_alerts" USING "btree" ("patient_id");



CREATE INDEX "idx_emergency_alerts_status" ON "public"."emergency_alerts" USING "btree" ("status");



CREATE INDEX "idx_medications_patient_id" ON "public"."medications" USING "btree" ("patient_id");



CREATE INDEX "idx_tasks_patient_id" ON "public"."tasks" USING "btree" ("patient_id");



CREATE INDEX "idx_visits_patient_id" ON "public"."visits" USING "btree" ("patient_id");



CREATE INDEX "idx_visits_vhv_id" ON "public"."visits" USING "btree" ("vhv_id");



CREATE INDEX "idx_vital_signs_patient_id" ON "public"."vital_signs" USING "btree" ("patient_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_vhv_id_fkey" FOREIGN KEY ("vhv_id") REFERENCES "public"."vhvs"("id");



ALTER TABLE ONLY "public"."emergency_alerts"
    ADD CONSTRAINT "emergency_alerts_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."emergency_alerts"
    ADD CONSTRAINT "emergency_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."emergency_alerts"
    ADD CONSTRAINT "emergency_alerts_vhv_id_fkey" FOREIGN KEY ("vhv_id") REFERENCES "public"."vhvs"("id");



ALTER TABLE ONLY "public"."intake_submissions"
    ADD CONSTRAINT "intake_submissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."intake_submissions"
    ADD CONSTRAINT "intake_submissions_vhv_id_fkey" FOREIGN KEY ("vhv_id") REFERENCES "public"."vhvs"("id");



ALTER TABLE ONLY "public"."medications"
    ADD CONSTRAINT "medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."medications"
    ADD CONSTRAINT "medications_prescribed_by_fkey" FOREIGN KEY ("prescribed_by") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."reschedule_requests"
    ADD CONSTRAINT "reschedule_requests_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."reschedule_requests"
    ADD CONSTRAINT "reschedule_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."reschedule_requests"
    ADD CONSTRAINT "reschedule_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_vhv_id_fkey" FOREIGN KEY ("vhv_id") REFERENCES "public"."vhvs"("id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_vhv_id_fkey" FOREIGN KEY ("vhv_id") REFERENCES "public"."vhvs"("id");



ALTER TABLE ONLY "public"."vital_signs"
    ADD CONSTRAINT "vital_signs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."vital_signs"
    ADD CONSTRAINT "vital_signs_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."vhvs"("id");



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."authenticate_user"("input_email" "text", "input_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."authenticate_user"("input_email" "text", "input_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."authenticate_user"("input_email" "text", "input_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password"("password" "text", "hashed_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password"("password" "text", "hashed_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("password" "text", "hashed_password" "text") TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."doctors" TO "anon";
GRANT ALL ON TABLE "public"."doctors" TO "authenticated";
GRANT ALL ON TABLE "public"."doctors" TO "service_role";



GRANT ALL ON TABLE "public"."emergency_alerts" TO "anon";
GRANT ALL ON TABLE "public"."emergency_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."emergency_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."intake_submissions" TO "anon";
GRANT ALL ON TABLE "public"."intake_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."intake_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."medications" TO "anon";
GRANT ALL ON TABLE "public"."medications" TO "authenticated";
GRANT ALL ON TABLE "public"."medications" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."reschedule_requests" TO "anon";
GRANT ALL ON TABLE "public"."reschedule_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."reschedule_requests" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."vhvs" TO "anon";
GRANT ALL ON TABLE "public"."vhvs" TO "authenticated";
GRANT ALL ON TABLE "public"."vhvs" TO "service_role";



GRANT ALL ON TABLE "public"."visits" TO "anon";
GRANT ALL ON TABLE "public"."visits" TO "authenticated";
GRANT ALL ON TABLE "public"."visits" TO "service_role";



GRANT ALL ON TABLE "public"."vital_signs" TO "anon";
GRANT ALL ON TABLE "public"."vital_signs" TO "authenticated";
GRANT ALL ON TABLE "public"."vital_signs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
