import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для управления сообщениями и чатами"""
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
            action = event.get('queryStringParameters', {}).get('action', 'chats')
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if action == 'chats':
                cur.execute("""
                    SELECT DISTINCT
                        c.id,
                        u.id, u.full_name, u.username, u.avatar_url,
                        m.content, m.created_at,
                        COUNT(CASE WHEN m2.is_read = FALSE AND m2.sender_id != %s THEN 1 END) as unread_count
                    FROM chats c
                    JOIN chat_participants cp1 ON c.id = cp1.chat_id
                    JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id != cp1.user_id
                    JOIN users u ON cp2.user_id = u.id
                    LEFT JOIN LATERAL (
                        SELECT content, created_at, sender_id
                        FROM messages
                        WHERE chat_id = c.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) m ON TRUE
                    LEFT JOIN messages m2 ON c.id = m2.chat_id
                    WHERE cp1.user_id = %s
                    GROUP BY c.id, u.id, m.content, m.created_at
                    ORDER BY m.created_at DESC NULLS LAST
                """, (user_id, user_id))
                
                chats = []
                for row in cur.fetchall():
                    chats.append({
                        'id': row[0],
                        'user': {
                            'id': row[1],
                            'full_name': row[2],
                            'username': row[3],
                            'avatar_url': row[4]
                        },
                        'last_message': row[5],
                        'last_message_time': row[6].isoformat() if row[6] else None,
                        'unread_count': row[7]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chats': chats}),
                    'isBase64Encoded': False
                }
            
            elif action == 'messages':
                chat_id = event.get('queryStringParameters', {}).get('chat_id')
                
                cur.execute("""
                    SELECT 
                        m.id, m.content, m.created_at, m.is_read,
                        u.id, u.full_name, u.avatar_url
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (chat_id,))
                
                messages = []
                for row in cur.fetchall():
                    messages.append({
                        'id': row[0],
                        'content': row[1],
                        'created_at': row[2].isoformat() if row[2] else None,
                        'is_read': row[3],
                        'sender': {
                            'id': row[4],
                            'full_name': row[5],
                            'avatar_url': row[6]
                        }
                    })
                
                cur.execute(
                    "UPDATE messages SET is_read = TRUE WHERE chat_id = %s AND sender_id != %s",
                    (chat_id, user_id)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_chat':
                user1_id = body.get('user1_id')
                user2_id = body.get('user2_id')
                
                cur.execute("""
                    SELECT c.id 
                    FROM chats c
                    JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = %s
                    JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = %s
                """, (user1_id, user2_id))
                
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'chat_id': existing_chat[0]}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("INSERT INTO chats DEFAULT VALUES RETURNING id")
                chat_id = cur.fetchone()[0]
                
                cur.execute(
                    "INSERT INTO chat_participants (chat_id, user_id) VALUES (%s, %s), (%s, %s)",
                    (chat_id, user1_id, chat_id, user2_id)
                )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send':
                chat_id = body.get('chat_id')
                sender_id = body.get('sender_id')
                content = body.get('content', '').strip()
                
                if not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Сообщение не может быть пустым'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO messages (chat_id, sender_id, content) VALUES (%s, %s, %s) RETURNING id, created_at",
                    (chat_id, sender_id, content)
                )
                message = cur.fetchone()
                
                cur.execute("""
                    SELECT user_id 
                    FROM chat_participants 
                    WHERE chat_id = %s AND user_id != %s
                """, (chat_id, sender_id))
                
                recipient = cur.fetchone()
                if recipient:
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, content, related_user_id) VALUES (%s, %s, %s, %s)",
                        (recipient[0], 'message', 'отправил вам сообщение', sender_id)
                    )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': message[0],
                        'created_at': message[1].isoformat() if message[1] else None
                    }),
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