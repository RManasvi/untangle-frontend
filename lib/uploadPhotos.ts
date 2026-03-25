'use server';

import { createClient } from '@supabase/supabase-js';

// Setup supabase client with service role for admin privileges like bucket creation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadTrainingPhotos(userId: string, photos: { expression: string, dataUrl: string }[]) {
    try {
        // 1. Ensure bucket exists
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

        if (bucketError) throw new Error(`Bucket error: ${bucketError.message}`);

        const bucketExists = buckets.some(b => b.name === 'training-photos');
        if (!bucketExists) {
            const { error: createError } = await supabase.storage.createBucket('training-photos', {
                public: true,
            });
            if (createError) throw new Error(`Error creating bucket: ${createError.message}`);
        }

        const uploadedUrls: string[] = [];

        // 2. Process and upload each photo
        for (const photo of photos) {
            // Decode base64
            const base64Data = photo.dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const timestamp = Date.now();

            // The image is already a JPEG from react-webcam at 640x480
            const processedBuffer = buffer;

            // Check file size (<2MB)
            if (processedBuffer.length > 2 * 1024 * 1024) {
                throw new Error(`Fixed image size limit exceeded for ${photo.expression}`);
            }

            const filePath = `${userId}/photo-${photo.expression}-${timestamp}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('training-photos')
                .upload(filePath, processedBuffer, {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

            const { data: publicUrlData } = supabase.storage
                .from('training-photos')
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrlData.publicUrl);
        }

        // 3. Update database: onboarding_step = 3 and store URLs
        // Note: This step is optional if the columns don't exist yet
        try {
            const { error: dbError } = await supabase
                .from('users')
                .update({
                    onboarding_step: 3,
                    user_training_photos: uploadedUrls
                })
                .eq('id', userId);

            if (dbError) {
                console.warn("Database update failed (likely missing columns):", dbError.message);
                // We don't throw here to allow user to continue if storage was successful
            }
        } catch (e) {
            console.error("Failed to update user profile in DB:", e);
        }

        return { success: true, urls: uploadedUrls };

    } catch (error: any) {
        console.error("Error in uploadTrainingPhotos:", error);
        return { success: false, error: error.message };
    }
}
