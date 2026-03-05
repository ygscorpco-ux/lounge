import { v2 as cloudinary } from 'cloudinary';
import { getCurrentUser } from '../../../lib/auth.js';
import { NextResponse } from 'next/server';

// Cloudinary 설정 — 환경변수에서 읽어옴
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다' }, { status: 400 });
    }

    // 허용 파일 타입
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다' }, { status: 400 });
    }

    // 파일을 Buffer로 변환 후 Cloudinary에 업로드
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'lounge',          // Cloudinary 내 폴더명
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }, // 자동 최적화
            { width: 1200, crop: 'limit' },             // 최대 너비 1200px로 제한
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('upload error:', error);
    return NextResponse.json({ error: '이미지 업로드 실패' }, { status: 500 });
  }
}
