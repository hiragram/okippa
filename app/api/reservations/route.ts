import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

/**
 * GET /api/reservations - 予約一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const space_id = searchParams.get('space_id');
    
    const db = getDb();
    let reservations;
    
    // ユーザーIDとスペースIDの両方で絞り込み
    if (user_id && space_id) {
      reservations = db.prepare(`
        SELECT 
          r.*,
          u.username as user_name,
          s.title as space_title,
          s.address as space_address,
          o.username as owner_name
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN spaces s ON r.space_id = s.id
        JOIN owners o ON s.owner_id = o.id
        WHERE r.user_id = ? AND r.space_id = ?
      `).all(user_id, space_id);
    }
    // ユーザーIDのみで絞り込み
    else if (user_id) {
      reservations = db.prepare(`
        SELECT 
          r.*,
          u.username as user_name,
          s.title as space_title,
          s.address as space_address,
          o.username as owner_name
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN spaces s ON r.space_id = s.id
        JOIN owners o ON s.owner_id = o.id
        WHERE r.user_id = ?
      `).all(user_id);
    }
    // スペースIDのみで絞り込み
    else if (space_id) {
      reservations = db.prepare(`
        SELECT 
          r.*,
          u.username as user_name,
          s.title as space_title,
          s.address as space_address,
          o.username as owner_name
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN spaces s ON r.space_id = s.id
        JOIN owners o ON s.owner_id = o.id
        WHERE r.space_id = ?
      `).all(space_id);
    }
    // 絞り込みなし（全件取得）
    else {
      reservations = db.prepare(`
        SELECT 
          r.*,
          u.username as user_name,
          s.title as space_title,
          s.address as space_address,
          o.username as owner_name
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN spaces s ON r.space_id = s.id
        JOIN owners o ON s.owner_id = o.id
      `).all();
    }
    
    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('予約取得エラー:', error);
    return NextResponse.json(
      { error: '予約情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations - 新しい予約を作成
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, space_id, start_date, end_date } = await request.json();
    
    // 入力検証
    if (!user_id || !space_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'ユーザーID、スペースID、開始日、終了日は必須です' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // ユーザーとスペースの存在チェック
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!user) {
      return NextResponse.json(
        { error: '指定されたユーザーIDは存在しません' },
        { status: 404 }
      );
    }
    
    // スペース情報を取得し型を定義
    interface SpaceInfo {
      id: number;
      price_per_day: number;
    }
    
    const space = db.prepare('SELECT id, price_per_day FROM spaces WHERE id = ?').get(space_id) as SpaceInfo;
    if (!space) {
      return NextResponse.json(
        { error: '指定されたスペースIDは存在しません' },
        { status: 404 }
      );
    }
    
    // 日付の検証
    const startDateTime = new Date(start_date);
    const endDateTime = new Date(end_date);
    
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: '無効な日付形式です。YYYY-MM-DD形式で指定してください' },
        { status: 400 }
      );
    }
    
    if (startDateTime > endDateTime) {
      return NextResponse.json(
        { error: '開始日は終了日より前の日付である必要があります' },
        { status: 400 }
      );
    }
    
    // 予約可能期間のチェック（既存の予約と重複していないか）
    const overlappingReservation = db.prepare(`
      SELECT id FROM reservations
      WHERE space_id = ?
      AND (
        (start_date <= ? AND end_date >= ?) OR
        (start_date <= ? AND end_date >= ?) OR
        (start_date >= ? AND end_date <= ?)
      )
      AND status != 'cancelled'
    `).get(
      space_id, 
      start_date, start_date,
      end_date, end_date,
      start_date, end_date
    );
    
    if (overlappingReservation) {
      return NextResponse.json(
        { error: '指定された期間は既に予約されています' },
        { status: 409 }
      );
    }
    
    // 日数計算（終了日も含む）
    const days = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const total_price = days * space.price_per_day;
    
    // 予約を作成
    const stmt = db.prepare(`
      INSERT INTO reservations (
        user_id, space_id, start_date, end_date, total_price,
        status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      user_id, space_id, start_date, end_date, total_price,
      'pending', 'unpaid'
    );
    
    return NextResponse.json(
      { 
        id: result.lastInsertRowid, 
        user_id,
        space_id,
        start_date,
        end_date,
        total_price,
        status: 'pending',
        payment_status: 'unpaid'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('予約作成エラー:', error);
    return NextResponse.json(
      { error: '予約作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reservations/:id - 予約ステータスの更新
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { status, payment_status } = await request.json();
    
    // 入力検証
    if (!status && !payment_status) {
      return NextResponse.json(
        { error: '更新するステータスが指定されていません' },
        { status: 400 }
      );
    }
    
    const db = getDb();
    
    // 予約の存在確認
    const reservation = db.prepare('SELECT id FROM reservations WHERE id = ?').get(id);
    if (!reservation) {
      return NextResponse.json(
        { error: '指定されたIDの予約が見つかりません' },
        { status: 404 }
      );
    }
    
    // 更新するフィールドと値
    const fieldsToUpdate = [];
    const values: any[] = [];
    
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: '無効な予約ステータスです' },
          { status: 400 }
        );
      }
      fieldsToUpdate.push('status = ?');
      values.push(status);
    }
    
    if (payment_status) {
      const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
      if (!validPaymentStatuses.includes(payment_status)) {
        return NextResponse.json(
          { error: '無効な支払いステータスです' },
          { status: 400 }
        );
      }
      fieldsToUpdate.push('payment_status = ?');
      values.push(payment_status);
    }
    
    fieldsToUpdate.push('updated_at = datetime("now", "localtime")');
    
    // 予約を更新
    const query = `
      UPDATE reservations
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = ?
    `;
    
    values.push(id);
    db.prepare(query).run(...values);
    
    // 更新された予約を取得
    const updatedReservation = db.prepare(`
      SELECT * FROM reservations WHERE id = ?
    `).get(id);
    
    return NextResponse.json(updatedReservation, { status: 200 });
  } catch (error) {
    console.error('予約更新エラー:', error);
    return NextResponse.json(
      { error: '予約更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reservations/:id - 特定の予約詳細を取得
 */
export async function GET_ONE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const db = getDb();
    
    const reservation = db.prepare(`
      SELECT 
        r.*,
        u.username as user_name,
        u.email as user_email,
        u.phone as user_phone,
        s.title as space_title,
        s.address as space_address,
        s.size_sqm,
        s.price_per_day,
        o.username as owner_name,
        o.email as owner_email,
        o.phone as owner_phone
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN spaces s ON r.space_id = s.id
      JOIN owners o ON s.owner_id = o.id
      WHERE r.id = ?
    `).get(id);
    
    if (!reservation) {
      return NextResponse.json(
        { error: '指定されたIDの予約が見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(reservation, { status: 200 });
  } catch (error) {
    console.error('予約取得エラー:', error);
    return NextResponse.json(
      { error: '予約情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
