# Supabase Setup Instructions

This app now uses Supabase for photo storage and real-time updates. Follow these steps to set up Supabase:

## 🚀 **1. Create a Supabase Project**

1. Go to [Supabase](https://supabase.com/)
2. Sign up/Sign in with your GitHub account
3. Click **"New project"**
4. Choose your organization
5. Enter project details:
   - **Name**: `photo-capture-app`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click **"Create new project"**
7. Wait for the project to be ready (1-2 minutes)

## 🗄️ **2. Set Up Database Table**

1. In your Supabase dashboard, go to **Table Editor**
2. Click **"Create a new table"**
3. Create table with these settings:
   - **Name**: `photos`
   - **Description**: `Photo metadata storage`
4. Add these columns:

| Column Name | Type | Default Value | Extra |
|-------------|------|---------------|-------|
| `id` | `int8` | - | Primary Key, Auto-increment |
| `filename` | `text` | - | Required |
| `url` | `text` | - | Required |
| `file_path` | `text` | - | Required |
| `size` | `int8` | - | Optional |
| `created_at` | `timestamptz` | `now()` | Required |

5. **Enable Row Level Security** (RLS):
   - Toggle "Enable RLS" to ON
   - Click **"Save"**

## 🔐 **3. Configure Security Policies**

1. Go to **Authentication > Policies**
2. Find your `photos` table and click **"Add Policy"**
3. **For Public Read Access** (photos can be viewed by anyone):
   ```sql
   -- Policy name: "Public photos are viewable by everyone"
   -- Operation: SELECT
   -- Policy:
   true
   ```

4. **For Public Insert Access** (anyone can upload photos):
   ```sql
   -- Policy name: "Anyone can upload photos"
   -- Operation: INSERT
   -- Policy:
   true
   ```

## 🗂️ **4. Set Up Storage Bucket**

1. Go to **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Create bucket with these settings:
   - **Name**: `photos`
   - **Public bucket**: ✅ **Enable** (for easy photo access)
   - **File size limit**: `50MB` (or your preference)
   - **Allowed MIME types**: `image/*`
4. Click **"Create bucket"**

## 🔧 **5. Configure Your App**

1. In your Supabase dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon public** key
3. Open `src/app/config/supabaseConfig.js` in your project
4. Replace the placeholder values:

```javascript
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://your-project-ref.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name for photos
export const PHOTOS_BUCKET = 'photos';

// Table name for photo metadata
export const PHOTOS_TABLE = 'photos';
```

## ✅ **6. Test Your Setup**

1. Start your development server:
   ```bash
   npm run dev:https
   ```

2. Open `https://192.168.8.201:3000` on your mobile device

3. Test the camera functionality:
   - Click "Start Camera"
   - Capture a photo
   - Check if it appears in the dashboard
   - Verify the photo is stored in Supabase Storage

## 🔄 **7. Enable Real-time Updates**

Real-time updates are automatically enabled with the current setup. When someone captures a photo:
- It's instantly uploaded to Supabase Storage
- Metadata is saved to the `photos` table
- All connected devices see the new photo immediately

## 🌟 **Benefits of Supabase vs Firebase**

✅ **Easier Setup**: No complex configuration files
✅ **Built-in Auth**: Ready for user authentication if needed
✅ **PostgreSQL**: Full SQL database with relations
✅ **Real-time**: Built-in real-time subscriptions
✅ **Storage**: Integrated file storage with CDN
✅ **Free Tier**: Generous free tier for development
✅ **Self-hosted Option**: Can be self-hosted if needed

## 🐛 **Troubleshooting**

### Photos not uploading:
- Check your Supabase URL and API key
- Verify the `photos` bucket exists and is public
- Check browser console for error messages

### Photos not appearing in dashboard:
- Verify the `photos` table exists with correct columns
- Check if Row Level Security policies allow SELECT
- Ensure real-time subscriptions are working

### CORS issues:
- Add your domain to Supabase **Authentication > URL Configuration**
- Ensure you're using the correct anon key

## 🔒 **Security Notes**

**Current Setup (Development):**
- Public access to read/write photos
- No authentication required
- Suitable for demos and development

**For Production:**
- Implement user authentication
- Restrict policies to authenticated users
- Add photo ownership checks
- Consider image optimization and resizing

Your photo capture app is now powered by Supabase! 🎉
