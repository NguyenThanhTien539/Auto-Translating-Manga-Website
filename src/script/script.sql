-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_approve_chapter (
  approval_id integer NOT NULL DEFAULT nextval('admin_approve_chapter_approval_id_seq'::regclass),
  admin_id integer,
  chapter_id integer,
  action character varying CHECK (action::text = ANY (ARRAY['Approved'::character varying, 'Rejected'::character varying]::text[])),
  reward_amount integer DEFAULT 0,
  admin_note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_approve_chapter_pkey PRIMARY KEY (approval_id),
  CONSTRAINT admin_approve_chapter_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(user_id),
  CONSTRAINT admin_approve_chapter_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id)
);
CREATE TABLE public.authors (
  author_id integer NOT NULL DEFAULT nextval('authors_author_id_seq'::regclass),
  author_name character varying NOT NULL,
  biography text,
  avatar_url text,
  CONSTRAINT authors_pkey PRIMARY KEY (author_id)
);
CREATE TABLE public.chapters (
  chapter_id integer NOT NULL DEFAULT nextval('chapters_chapter_id_seq'::regclass),
  manga_id integer,
  uploader_id integer,
  chapter_number double precision NOT NULL,
  title character varying,
  price numeric DEFAULT 0 CHECK (price >= 0::numeric),
  status character varying DEFAULT 'Pending'::character varying CHECK (status::text = ANY (ARRAY['Pending'::character varying, 'Published'::character varying, 'Rejected'::character varying]::text[])),
  published_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chapters_pkey PRIMARY KEY (chapter_id),
  CONSTRAINT chapters_manga_id_fkey FOREIGN KEY (manga_id) REFERENCES public.mangas(manga_id),
  CONSTRAINT chapters_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.coin_history (
  history_id integer NOT NULL DEFAULT nextval('coin_history_history_id_seq'::regclass),
  user_id integer,
  amount integer NOT NULL,
  description character varying,
  type character varying CHECK (type::text = ANY (ARRAY['Deposit'::character varying, 'Purchase'::character varying, 'Reward'::character varying, 'Refund'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_history_pkey PRIMARY KEY (history_id),
  CONSTRAINT coin_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.coin_packages (
  id integer NOT NULL DEFAULT nextval('coin_packages_id_seq'::regclass),
  coins integer NOT NULL,
  price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coin_packages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  comment_id integer NOT NULL DEFAULT nextval('comments_comment_id_seq'::regclass),
  user_id integer,
  chapter_id integer,
  content text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (comment_id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT comments_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id)
);
CREATE TABLE public.deposit_transactions (
  deposit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id integer,
  payment_method character varying NOT NULL,
  status character varying DEFAULT 'Pending'::character varying CHECK (status::text = ANY (ARRAY['Pending'::character varying, 'Success'::character varying, 'Failed'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  coin_package_id integer,
  CONSTRAINT deposit_transactions_pkey PRIMARY KEY (deposit_id),
  CONSTRAINT deposit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.favorites (
  user_id integer NOT NULL,
  manga_id integer NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (user_id, manga_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT favorites_manga_id_fkey FOREIGN KEY (manga_id) REFERENCES public.mangas(manga_id)
);
CREATE TABLE public.genres (
  genre_id integer NOT NULL DEFAULT nextval('genres_genre_id_seq'::regclass),
  genre_name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  CONSTRAINT genres_pkey PRIMARY KEY (genre_id)
);
CREATE TABLE public.languages (
  language_id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  language_name text NOT NULL,
  language_code character varying NOT NULL UNIQUE,
  CONSTRAINT languages_pkey PRIMARY KEY (language_id)
);
CREATE TABLE public.manga_genre (
  manga_id integer NOT NULL,
  genre_id integer NOT NULL,
  CONSTRAINT manga_genre_pkey PRIMARY KEY (manga_id, genre_id),
  CONSTRAINT fk_manga_genre_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(manga_id),
  CONSTRAINT fk_manga_genre_genre FOREIGN KEY (genre_id) REFERENCES public.genres(genre_id)
);
CREATE TABLE public.mangas (
  manga_id integer NOT NULL DEFAULT nextval('mangas_manga_id_seq'::regclass),
  title character varying NOT NULL,
  description text,
  cover_image text,
  status character varying DEFAULT 'Pending'::character varying CHECK (status::text = ANY (ARRAY['Pending'::character varying, 'OnGoing'::character varying, 'Completed'::character varying, 'Dropped'::character varying, 'Rejected'::character varying]::text[])),
  is_highlighted boolean DEFAULT false,
  highlight_end_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  author_id integer,
  uploader_id integer,
  original_language text,
  CONSTRAINT mangas_pkey PRIMARY KEY (manga_id),
  CONSTRAINT mangas_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(author_id),
  CONSTRAINT mangas_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.otp_codes (
  id integer NOT NULL DEFAULT nextval('otp_codes_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  otp character varying NOT NULL,
  otp_expiry timestamp without time zone DEFAULT (now() + '00:02:00'::interval),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pages (
  page_id integer NOT NULL DEFAULT nextval('pages_page_id_seq'::regclass),
  chapter_id integer,
  page_number integer NOT NULL,
  image_url text NOT NULL,
  language character varying NOT NULL DEFAULT 'original'::character varying,
  CONSTRAINT pages_pkey PRIMARY KEY (page_id),
  CONSTRAINT pages_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id)
);
CREATE TABLE public.purchased_chapters (
  purchase_id integer NOT NULL DEFAULT nextval('purchased_chapters_purchase_id_seq'::regclass),
  user_id integer,
  chapter_id integer,
  price_at_purchase integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchased_chapters_pkey PRIMARY KEY (purchase_id),
  CONSTRAINT purchased_chapters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT purchased_chapters_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id)
);
CREATE TABLE public.reading_history (
  user_id integer NOT NULL,
  chapter_id integer NOT NULL,
  manga_id integer,
  last_page_read integer DEFAULT 1,
  last_read_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_history_pkey PRIMARY KEY (user_id, chapter_id),
  CONSTRAINT reading_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT reading_history_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id),
  CONSTRAINT reading_history_manga_id_fkey FOREIGN KEY (manga_id) REFERENCES public.mangas(manga_id)
);
CREATE TABLE public.role (
  role_id character NOT NULL,
  role_name character varying,
  role_code character varying,
  role_description character varying,
  CONSTRAINT role_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.uploader_requests (
  request_id integer NOT NULL DEFAULT nextval('uploader_requests_request_id_seq'::regclass),
  user_id integer NOT NULL,
  reason text NOT NULL,
  request_status character varying NOT NULL DEFAULT 'pending'::character varying,
  admin_note text,
  request_created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uploader_requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT fk_uploader_requests_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  username character varying,
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  phone character,
  role_id character DEFAULT '1'::bpchar,
  address character varying,
  created_at timestamp with time zone DEFAULT now(),
  coin_balance integer DEFAULT 0 CHECK (coin_balance >= 0),
  avatar text,
  user_status text DEFAULT 'active'::text,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES public.role(role_id)
);