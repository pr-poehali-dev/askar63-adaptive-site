import json
import os
import psycopg2
import bcrypt
import secrets
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """API для регистрации, авторизации и управления пользователями"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
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
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                phone = body.get('phone', '').strip()
                password = body.get('password', '').strip()
                full_name = body.get('full_name', '').strip()
                
                if not phone or not password or not full_name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'}),
                        'isBase64Encoded': False
                    }
                
                username = full_name.lower().replace(' ', '_') + '_' + secrets.token_hex(3)
                
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                try:
                    cur.execute(
                        "INSERT INTO users (phone, password_hash, full_name, username) VALUES (%s, %s, %s, %s) RETURNING id, username, full_name, is_admin",
                        (phone, password_hash, full_name, username)
                    )
                    user = cur.fetchone()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'user': {
                                'id': user[0],
                                'username': user[1],
                                'full_name': user[2],
                                'is_admin': user[3]
                            }
                        }),
                        'isBase64Encoded': False
                    }
                except psycopg2.IntegrityError:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Номер телефона уже зарегистрирован'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'login':
                phone = body.get('phone', '').strip()
                password = body.get('password', '').strip()
                
                if not phone or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Введите телефон и пароль'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT id, password_hash, username, full_name, is_admin, is_banned, avatar_url, bio FROM users WHERE phone = %s",
                    (phone,)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный номер телефона или пароль'}),
                        'isBase64Encoded': False
                    }
                
                if user[5]:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Ваш аккаунт заблокирован администратором'}),
                        'isBase64Encoded': False
                    }
                
                if bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'user': {
                                'id': user[0],
                                'username': user[2],
                                'full_name': user[3],
                                'is_admin': user[4],
                                'avatar_url': user[6],
                                'bio': user[7]
                            }
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный номер телефона или пароль'}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'GET':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if user_id:
                cur.execute(
                    "SELECT id, username, full_name, avatar_url, bio, is_admin, is_banned FROM users WHERE id = %s",
                    (user_id,)
                )
                user = cur.fetchone()
                
                if user:
                    cur.execute(
                        "SELECT COUNT(*) FROM follows WHERE follower_id = %s",
                        (user_id,)
                    )
                    following_count = cur.fetchone()[0]
                    
                    cur.execute(
                        "SELECT COUNT(*) FROM follows WHERE following_id = %s",
                        (user_id,)
                    )
                    followers_count = cur.fetchone()[0]
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'id': user[0],
                            'username': user[1],
                            'full_name': user[2],
                            'avatar_url': user[3],
                            'bio': user[4],
                            'is_admin': user[5],
                            'is_banned': user[6],
                            'followers_count': followers_count,
                            'following_count': following_count
                        }),
                        'isBase64Encoded': False
                    }
            
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь не найден'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            
            updates = []
            params = []
            
            if 'full_name' in body:
                updates.append('full_name = %s')
                params.append(body['full_name'])
            
            if 'bio' in body:
                updates.append('bio = %s')
                params.append(body['bio'])
            
            if 'avatar_url' in body:
                updates.append('avatar_url = %s')
                params.append(body['avatar_url'])
            
            if updates:
                params.append(user_id)
                cur.execute(
                    f"UPDATE users SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, username, full_name, avatar_url, bio",
                    params
                )
                user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': {
                            'id': user[0],
                            'username': user[1],
                            'full_name': user[2],
                            'avatar_url': user[3],
                            'bio': user[4]
                        }
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