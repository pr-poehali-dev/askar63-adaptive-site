import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для управления уведомлениями"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            cur.execute("""
                SELECT 
                    n.id, n.type, n.content, n.is_read, n.created_at,
                    u.id, u.full_name, u.avatar_url
                FROM notifications n
                JOIN users u ON n.related_user_id = u.id
                WHERE n.user_id = %s
                ORDER BY n.created_at DESC
                LIMIT 50
            """, (user_id,))
            
            notifications = []
            for row in cur.fetchall():
                notifications.append({
                    'id': row[0],
                    'type': row[1],
                    'content': row[2],
                    'is_read': row[3],
                    'created_at': row[4].isoformat() if row[4] else None,
                    'user': {
                        'id': row[5],
                        'full_name': row[6],
                        'avatar_url': row[7]
                    }
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'notifications': notifications}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'mark_read':
                notification_id = body.get('notification_id')
                
                cur.execute(
                    "UPDATE notifications SET is_read = TRUE WHERE id = %s",
                    (notification_id,)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'mark_all_read':
                user_id = body.get('user_id')
                
                cur.execute(
                    "UPDATE notifications SET is_read = TRUE WHERE user_id = %s",
                    (user_id,)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
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