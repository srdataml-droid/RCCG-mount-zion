PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS church_info (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  pastorName TEXT NOT NULL,
  pastorTitle TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  facebook_url TEXT NOT NULL,
  liveStreamEmbedId TEXT NOT NULL DEFAULT '',
  liveStreamUrl TEXT,
  serviceTimes TEXT NOT NULL,
  accentColor TEXT NOT NULL DEFAULT 'indigo',
  logoText TEXT NOT NULL DEFAULT 'Mount Zion',
  isLiveNow INTEGER NOT NULL DEFAULT 0 CHECK (isLiveNow IN (0, 1))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  endDate TEXT,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Special', 'Weekly', 'Youth', 'Women', 'Men', 'Prayer')),
  bannerUrl TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);

CREATE TABLE IF NOT EXISTS testimonies (
  id TEXT PRIMARY KEY,
  authorName TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
  isApproved INTEGER NOT NULL DEFAULT 0 CHECK (isApproved IN (0, 1))
);
CREATE INDEX IF NOT EXISTS testimonies_public_idx ON testimonies(isApproved, date DESC);

CREATE TABLE IF NOT EXISTS connect_cards (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  isFirstTime INTEGER NOT NULL CHECK (isFirstTime IN (0, 1)),
  prayerRequest TEXT NOT NULL DEFAULT '',
  interestInGroups TEXT NOT NULL DEFAULT '[]',
  submittedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS connect_cards_submitted_idx ON connect_cards(submittedAt DESC);

CREATE TABLE IF NOT EXISTS meeting_requests (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  contact TEXT NOT NULL,
  preferredDateTime TEXT NOT NULL,
  reason TEXT NOT NULL,
  submittedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS meeting_requests_submitted_idx ON meeting_requests(submittedAt DESC);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  howToJoin TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS departments_name_idx ON departments(name);

CREATE TABLE IF NOT EXISTS giving_accounts (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE CHECK (category IN ('Tithe', 'Offering', 'Thanksgiving', 'Building Fund', 'Missions', 'Other')),
  bankName TEXT NOT NULL,
  accountName TEXT NOT NULL,
  accountNumber TEXT NOT NULL
);

INSERT OR IGNORE INTO church_info (
  id, name, tagline, pastorName, pastorTitle, address, city, state, phone, email,
  facebook_url, liveStreamEmbedId, liveStreamUrl, serviceTimes, accentColor, logoText, isLiveNow
) VALUES (
  'parish-1', 'RCCG Mount Zion Wellington', 'A House of Faith in the Heart of Wellington',
  'Hannah Adeniran', 'Assistant Pastor', '550 High Street', 'Lower Hutt', 'Wellington 5018',
  '06-07730881', 'rccgmountzionwellington@gmail.com', 'https://www.facebook.com/rccgmountzionwellington3757',
  '', NULL,
  '[{"day":"Sunday","time":"10:00 AM - 12:00 PM","name":"Sunday Service"},{"day":"Tuesday","time":"06:00 PM - 07:00 PM","name":"Digging Deep"},{"day":"Thursday","time":"06:00 PM - 07:00 PM","name":"Faith Clinic"}]',
  'indigo', 'Mount Zion', 0
);

INSERT OR IGNORE INTO departments (id, name, description, howToJoin) VALUES
  ('dept-choir', 'Choir', 'Supporting worship through song and music.', 'Complete a connect card and tell the team you would like to serve in music.'),
  ('dept-usher', 'Usher', 'Helping every visitor feel seen, comfortable and at home.', 'Complete a connect card and let us know you are interested in welcoming people.'),
  ('dept-media', 'Media & Technical Team', 'Supporting sound, projection, livestream and digital communication.', 'Complete a connect card and select the media or technical team as your area of interest.'),
  ('dept-prayer', 'Prayer Ministry', 'Praying faithfully for the church, community and the needs entrusted to us.', 'Send a connect card or speak with the team after a service to learn more.'),
  ('dept-children', 'Children''s Ministry', 'Creating a safe, joyful space where children can learn and grow in faith.', 'Complete a connect card and tell the team you would like to hear about serving with children.');

-- No historical events or private submissions were present in the repository.
-- Re-enter current public event and giving information through the admin panel.
