import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

/**
 * GET /api/spaces/:id - 特定のスペースの詳細を取得
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const db = getDb();
    
    // スペースの型を定義
    interface Space {
      id: number;
      owner_id: number;
      title: string;
      description: string | null;
      address: string;
      size_sqm: number;
      price_per_day: number;
      available_from: string;
      available_until: string | null;
      amenities: string | string[];
      images: string | string[];
      owner_name: string;
      owner_phone: string;
      owner_email: string;
      created_at: string;
      updated_at: string;
    }
    
    const space = db.prepare(`
      SELECT 
        s.*,
        o.username as owner_name,
        o.phone as owner_phone,
        o.email as owner_email
      FROM spaces s
      JOIN owners o ON s.owner_id = o.id
      WHERE s.id = ?
    `).get(id);
    
    if (!space) {
      return NextResponse.json(
        { error: '指定されたIDのスペースが見つかりません' },
        { status: 404 }
      );
    }
    
    // データベースから取得した結果をSpace型として扱う
    const typedSpace = space as Space;
    
    // amenitiesとimagesを配列に変換
    if (typedSpace.amenities && typeof typedSpace.amenities === 'string') {
      typedSpace.amenities = typedSpace.amenities.split(',');
    }
    
    if (typedSpace.images && typeof typedSpace.images === 'string') {
      typedSpace.images = typedSpace.images.split(',');
    }
    
    return NextResponse.json(typedSpace, { status: 200 });
  } catch (error) {
    console.error('スペース取得エラー:', error);
    return NextResponse.json(
      { error: 'スペース情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
