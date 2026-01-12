import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для управления постами, лайками и комментариями"""
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
            action = event.get('queryStringParameters', {}).get('action', 'feed')
            
            if action == 'feed':
                cur.execute("""
                    SELECT 
                        p.id, p.content, p.created_at,
                        u.id, u.full_name, u.username, u.avatar_url,
                        COUNT(DISTINCT pl.id) as likes_count,
                        COUNT(DISTINCT c.id) as comments_count
                    FROM posts p
                    JOIN users u ON p.user_id = u.id
                    LEFT JOIN post_likes pl ON p.id = pl.post_id
                    LEFT JOIN comments c ON p.id = c.post_id
                    GROUP BY p.id, u.id
                    ORDER BY p.created_at DESC
                    LIMIT 50
                """)
                
                posts = []
                for row in cur.fetchall():
                    posts.append({
                        'id': row[0],
                        'content': row[1],
                        'created_at': row[2].isoformat() if row[2] else None,
                        'author': {
                            'id': row[3],
                            'full_name': row[4],
                            'username': row[5],
                            'avatar_url': row[6]
                        },
                        'likes': row[7],
                        'comments': row[8]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'posts': posts}),
                    'isBase64Encoded': False
                }
            
            elif action == 'user_posts':
                user_id = event.get('queryStringParameters', {}).get('user_id')
                
                cur.execute("""
                    SELECT 
                        p.id, p.content, p.created_at,
                        COUNT(DISTINCT pl.id) as likes_count,
                        COUNT(DISTINCT c.id) as comments_count
                    FROM posts p
                    LEFT JOIN post_likes pl ON p.id = pl.post_id
                    LEFT JOIN comments c ON p.id = c.post_id
                    WHERE p.user_id = %s
                    GROUP BY p.id
                    ORDER BY p.created_at DESC
                """, (user_id,))
                
                posts = []
                for row in cur.fetchall():
                    posts.append({
                        'id': row[0],
                        'content': row[1],
                        'created_at': row[2].isoformat() if row[2] else None,
                        'likes': row[3],
                        'comments': row[4]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'posts': posts}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create':
                user_id = body.get('user_id')
                content = body.get('content', '').strip()
                
                if not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Контент не может быть пустым'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO posts (user_id, content) VALUES (%s, %s) RETURNING id, created_at",
                    (user_id, content)
                )
                post = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'post': {
                            'id': post[0],
                            'created_at': post[1].isoformat() if post[1] else None
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'like':
                user_id = body.get('user_id')
                post_id = body.get('post_id')
                
                try:
                    cur.execute(
                        "INSERT INTO post_likes (post_id, user_id) VALUES (%s, %s)",
                        (post_id, user_id)
                    )
                    
                    cur.execute(
                        "SELECT user_id FROM posts WHERE id = %s",
                        (post_id,)
                    )
                    post_author = cur.fetchone()
                    
                    if post_author and post_author[0] != user_id:
                        cur.execute(
                            "INSERT INTO notifications (user_id, type, content, related_user_id, related_post_id) VALUES (%s, %s, %s, %s, %s)",
                            (post_author[0], 'like', 'лайкнул ваш пост', user_id, post_id)
                        )
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
                except psycopg2.IntegrityError:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Уже лайкнуто'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'comment':
                user_id = body.get('user_id')
                post_id = body.get('post_id')
                content = body.get('content', '').strip()
                
                if not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Комментарий не может быть пустым'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s) RETURNING id",
                    (post_id, user_id, content)
                )
                comment = cur.fetchone()
                
                cur.execute(
                    "SELECT user_id FROM posts WHERE id = %s",
                    (post_id,)
                )
                post_author = cur.fetchone()
                
                if post_author and post_author[0] != user_id:
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, content, related_user_id, related_post_id) VALUES (%s, %s, %s, %s, %s)",
                        (post_author[0], 'comment', 'прокомментировал ваш пост', user_id, post_id)
                    )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'comment_id': comment[0]}),
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