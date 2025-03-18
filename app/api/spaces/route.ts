import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

/**
 * GET /api/spaces - すべての貸出スペースを取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner_id = searchParams.get('owner_id');
    
    const db = getDb();
    let spaces;
    
    if (owner_id) {
      spaces = db.prepare(`
        SELECT 
          s.*,
          o.username as owner_name
        FROM spaces s
        JOIN owners o ON s.owner_id = o.id
        WHERE s.owner_id = ?
      `).all(owner_id);
    } else {
      spaces = db.prepare(`
        SELECT 
          s.*,
          o.username as owner_name
        FROM spaces s
        JOIN owners o ON s.owner_id = o.id
      `).all();
    }
    
    return NextResponse.json({ spaces }, { status: 200 });
  } catch (error) {
    console.error('スペース取得エラー:', error);
    return NextResponse.json(
      { error: 'スペース情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/spaces - 新しい貸出スペースを作成
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      owner_id, title, description, address, size_sqm, 
      price_per_day, available_from, available_until, amenities, images
    } = await request.json();
    
    // 入力検証
    if (!owner_id || !title || !address || !size_sqm || !price_per_day || !available_from) {
      return NextResponse.json(
        { error: 'オーナーID、タイトル、住所、サイズ、価格、利用可能開始日は必須です' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // オーナーが存在するか確認
    const owner = db.prepare('SELECT id FROM owners WHERE id = ?').get(owner_id);
    if (!owner) {
      return NextResponse.json(
        { error: '指定されたオーナーIDは存在しません' },
        { status: 404 }
      );
    }
    
    const stmt = db.prepare(`
      INSERT INTO spaces (
        owner_id, title, description, address, size_sqm, 
        price_per_day, available_from, available_until, amenities, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // amenitiesとimagesは文字列としてカンマ区切りで保存
    const amenitiesStr = Array.isArray(amenities) ? amenities.join(',') : amenities;
    const imagesStr = Array.isArray(images) ? images.join(',') : images;
    
    const result = stmt.run(
      owner_id, title, description || null, address, size_sqm, 
      price_per_day, available_from, available_until || null, amenitiesStr || null, imagesStr || null
    );
    
    return NextResponse.json(
      { 
        id: result.lastInsertRowid, 
        owner_id, 
        title, 
        address,
        size_sqm,
        price_per_day
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('スペース作成エラー:', error);
    return NextResponse.json(
      { error: 'スペース作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/spaces/:id - 特定のスペースの詳細を取得
 */
export async function GET_ONE(request: NextRequest, { params }: { params: { id: string } }) {
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
