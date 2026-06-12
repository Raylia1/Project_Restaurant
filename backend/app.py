from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

db = mysql.connector.connect(
    host="mysql-db",
    user="root",
    password="root123",
    database="restaurant_db"
)

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json

    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO orders
        (notes, subtotal, tax, total)
        VALUES (%s,%s,%s,%s)
    """, (
        data["notes"],
        data["totals"]["subtotal"],
        data["totals"]["tax"],
        data["totals"]["total"]
    ))

    order_id = cursor.lastrowid

    for item in data["items"]:
        cursor.execute("""
            INSERT INTO order_items
            (order_id,item_name,qty,price,modifiers)
            VALUES (%s,%s,%s,%s,%s)
        """, (
            order_id,
            item["name"],
            item["qty"],
            item["price"],
            item.get("modifiers", "")
        ))

    db.commit()

    return jsonify({
        "message": "Order saved",
        "order_id": order_id
    })

@app.route('/api/orders', methods=['GET'])
def get_orders():

    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM orders
        ORDER BY created_at DESC
    """)

    orders = cursor.fetchall()

    for order in orders:

        item_cursor = db.cursor(dictionary=True)

        item_cursor.execute("""
            SELECT item_name, qty, price, modifiers
            FROM order_items
            WHERE order_id=%s
        """, (order['id'],))

        order['items'] = item_cursor.fetchall()

    return jsonify(orders)

@app.route('/api/orders/<int:id>', methods=['PUT'])
def complete_order(id):

    cursor = db.cursor()

    cursor.execute("""
        UPDATE orders
        SET status='Completed'
        WHERE id=%s
    """, (id,))

    db.commit()

    return jsonify({"message":"Order completed"})

@app.route('/api/orders/<int:id>', methods=['DELETE'])
def delete_order(id):

    cursor = db.cursor()

    cursor.execute("""
        DELETE FROM orders
        WHERE id=%s
    """, (id,))

    db.commit()

    return jsonify({"message":"Order deleted"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)