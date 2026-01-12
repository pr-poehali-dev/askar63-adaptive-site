import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для админ-панели: управление пользователями, модерация"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ['DATABASE_URL']
    
    conn = psycopg2.connect(db_url)
    conn.set_session(autocommit=True)
    cur = conn.cursor()
    
    try:
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'stats')
            
            if action == 'stats':
                cur.execute("SELECT COUNT(*) FROM users")
                users_count = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM posts")
                posts_count = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM users WHERE is_banned = TRUE")
                banned_count = cur.fetchone()[0]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'users_count': users_count,
                        'posts_count': posts_count,
                        'banned_count': banned_count
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'users':
                cur.execute("""
                    SELECT id, full_name, username, phone, is_admin, is_banned, avatar_url, created_at
                    FROM users
                    ORDER BY created_at DESC
                """)
                
                users = []
                for row in cur.fetchall():
                    users.append({
                        'id': row[0],
                        'full_name': row[1],
                        'username': row[2],
                        'phone': row[3],
                        'is_admin': row[4],
                        'is_banned': row[5],
                        'avatar_url': row[6],
                        'created_at': row[7].isoformat() if row[7] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            user_id = body.get('user_id')
            admin_id = body.get('admin_id')
            
            cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
            admin = cur.fetchone()
            
            if not admin or not admin[0]:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Доступ запрещён'}),
                    'isBase64Encoded': False
                }
            
            if action == 'ban':
                cur.execute(
                    "UPDATE users SET is_banned = TRUE WHERE id = %s",
                    (user_id,)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Пользователь заблокирован'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unban':
                cur.execute(
                    "UPDATE users SET is_banned = FALSE WHERE id = %s",
                    (user_id,)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Пользователь разблокирован'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'grant_admin':
                cur.execute(
                    "UPDATE users SET is_admin = TRUE WHERE id = %s",
                    (user_id,)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Права администратора выданы'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'revoke_admin':
                cur.execute(
                    "UPDATE users SET is_admin = FALSE WHERE id = %s",
                    (user_id,)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Права администратора отозваны'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_user':
                updates = []
                params = []
                
                if 'full_name' in body:
                    updates.append('full_name = %s')
                    params.append(body['full_name'])
                
                if 'username' in body:
                    updates.append('username = %s')
                    params.append(body['username'])
                
                if updates:
                    params.append(user_id)
                    cur.execute(
                        f"UPDATE users SET {', '.join(updates)} WHERE id = %s",
                        params
                    )
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Данные пользователя обновлены'}),
                        'isBase64Encoded': False
                    }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()